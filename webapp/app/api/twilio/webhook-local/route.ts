import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Try to fetch the public URL from the websocket server
    const wsServerUrl = process.env.WEBSOCKET_SERVER_URL || "http://localhost:8081";
    const response = await fetch(`${wsServerUrl}/public-url`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch public URL from websocket server");
    }
    
    const data = await response.json();
    return NextResponse.json({ 
      publicUrl: data.publicUrl 
    });
  } catch (error) {
    console.error("Error fetching public URL:", error);
    
    // If we can't fetch from the websocket server, try to use the environment variable
    const publicUrl = process.env.PUBLIC_URL || "";
    
    return NextResponse.json({ 
      publicUrl,
      error: "Error fetching from websocket server" 
    });
  }
}