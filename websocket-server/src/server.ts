import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import dotenv from "dotenv";
import http from "http";
import { readFileSync } from "fs";
import { join } from "path";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import {
  handleCallConnection,
  handleFrontendConnection,
} from "./sessionManager";
import functions from "./functionHandlers";

dotenv.config();

const PORT = parseInt(process.env.PORT || "8081", 10);
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// Initialize the OAuth2 client for IAM token verification
const oauth2Client = new OAuth2Client();

if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

if (!GOOGLE_CLIENT_ID && process.env.NODE_ENV === "production") {
  console.warn("GOOGLE_CLIENT_ID environment variable is not set in production mode");
  // Continue execution instead of exiting
}

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.urlencoded({ extended: false }));

const twimlPath = join(__dirname, "twiml.xml");
const twimlTemplate = readFileSync(twimlPath, "utf-8");

app.get("/public-url", (req, res) => {
  res.json({ publicUrl: PUBLIC_URL });
});

app.all("/twiml", (req, res) => {
  const wsUrl = new URL(PUBLIC_URL);
  wsUrl.protocol = "wss:";
  wsUrl.pathname = `/call`;

  const twimlContent = twimlTemplate.replace("{{WS_URL}}", wsUrl.toString());
  res.type("text/xml").send(twimlContent);
});

// New endpoint to list available tools (schemas)
app.get("/tools", (req, res) => {
  res.json(functions.map((f) => f.schema));
});

// Middleware to verify IAM tokens for HTTP requests
const verifyIamToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip authentication for Twilio webhook and TwiML routes and in development mode
  if (req.path === "/twiml" || process.env.NODE_ENV === "development") {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      // Verify IAM token
      await oauth2Client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID
      });
      // If IAM verification succeeds, allow the request
      return next();
    } catch (error) {
      console.error("IAM token verification failed:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
};

// Apply the middleware to specific routes
app.use("/public-url", verifyIamToken);
app.use("/tools", verifyIamToken);

let currentCall: WebSocket | null = null;
let currentLogs: WebSocket | null = null;

// Helper function to verify WebSocket connections
async function verifyWebSocketIamToken(token: string): Promise<boolean> {
  if (!token) return false;
  
  try {
    await oauth2Client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });
    return true;
  } catch (error) {
    console.error("WebSocket IAM token verification failed:", error);
    return false;
  }
}

wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length < 1) {
    ws.close();
    return;
  }

  const type = parts[0];
  
  // Don't authenticate call connections from Twilio
  if (type === "call") {
    if (currentCall) currentCall.close();
    currentCall = ws;
    handleCallConnection(currentCall, OPENAI_API_KEY);
    return;
  }
  
  // Skip authentication in development mode
  if (process.env.NODE_ENV === "development") {
    if (type === "logs") {
      if (currentLogs) currentLogs.close();
      currentLogs = ws;
      handleFrontendConnection(currentLogs);
      return;
    }
  }
  
  // For logs/frontend connections in production, verify IAM token
  const token = url.searchParams.get("token");
  const isAuthenticated = token ? await verifyWebSocketIamToken(token) : false;
  
  if (!isAuthenticated) {
    console.log("Unauthorized WebSocket connection attempt");
    ws.close(1008, "Unauthorized");
    return;
  }

  if (type === "logs") {
    if (currentLogs) currentLogs.close();
    currentLogs = ws;
    handleFrontendConnection(currentLogs);
  } else {
    ws.close();
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});