"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const fs_1 = require("fs");
const path_1 = require("path");
const cors_1 = __importDefault(require("cors"));
const google_auth_library_1 = require("google-auth-library");
const sessionManager_1 = require("./sessionManager");
const functionHandlers_1 = __importDefault(require("./functionHandlers"));
dotenv_1.default.config();
const PORT = parseInt(process.env.PORT || "8081", 10);
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
// Initialize the OAuth2 client for IAM token verification
const oauth2Client = new google_auth_library_1.OAuth2Client();
if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is required");
    process.exit(1);
}
if (!GOOGLE_CLIENT_ID && process.env.NODE_ENV === "production") {
    console.error("GOOGLE_CLIENT_ID environment variable is required in production mode");
    process.exit(1);
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
app.use(express_1.default.urlencoded({ extended: false }));
const twimlPath = (0, path_1.join)(__dirname, "twiml.xml");
const twimlTemplate = (0, fs_1.readFileSync)(twimlPath, "utf-8");
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
    res.json(functionHandlers_1.default.map((f) => f.schema));
});
// Middleware to verify IAM tokens for HTTP requests
const verifyIamToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Skip authentication for Twilio webhook and TwiML routes and in development mode
    if (req.path === "/twiml" || process.env.NODE_ENV === "development") {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
            // Verify IAM token
            yield oauth2Client.verifyIdToken({
                idToken: token,
                audience: GOOGLE_CLIENT_ID
            });
            // If IAM verification succeeds, allow the request
            return next();
        }
        catch (error) {
            console.error("IAM token verification failed:", error);
            return res.status(401).json({ error: "Unauthorized" });
        }
    }
    return res.status(401).json({ error: "Unauthorized" });
});
// Apply the middleware to specific routes
app.use("/public-url", verifyIamToken);
app.use("/tools", verifyIamToken);
let currentCall = null;
let currentLogs = null;
// Helper function to verify WebSocket connections
function verifyWebSocketIamToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token)
            return false;
        try {
            yield oauth2Client.verifyIdToken({
                idToken: token,
                audience: GOOGLE_CLIENT_ID
            });
            return true;
        }
        catch (error) {
            console.error("WebSocket IAM token verification failed:", error);
            return false;
        }
    });
}
wss.on("connection", (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 1) {
        ws.close();
        return;
    }
    const type = parts[0];
    // Don't authenticate call connections from Twilio
    if (type === "call") {
        if (currentCall)
            currentCall.close();
        currentCall = ws;
        (0, sessionManager_1.handleCallConnection)(currentCall, OPENAI_API_KEY);
        return;
    }
    // Skip authentication in development mode
    if (process.env.NODE_ENV === "development") {
        if (type === "logs") {
            if (currentLogs)
                currentLogs.close();
            currentLogs = ws;
            (0, sessionManager_1.handleFrontendConnection)(currentLogs);
            return;
        }
    }
    // For logs/frontend connections in production, verify IAM token
    const token = url.searchParams.get("token");
    const isAuthenticated = token ? yield verifyWebSocketIamToken(token) : false;
    if (!isAuthenticated) {
        console.log("Unauthorized WebSocket connection attempt");
        ws.close(1008, "Unauthorized");
        return;
    }
    if (type === "logs") {
        if (currentLogs)
            currentLogs.close();
        currentLogs = ws;
        (0, sessionManager_1.handleFrontendConnection)(currentLogs);
    }
    else {
        ws.close();
    }
}));
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
