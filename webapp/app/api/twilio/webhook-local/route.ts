import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Try to fetch the public URL from the websocket server
    const wsServerUrl = process.env.WEBSOCKET_SERVER_URL || "http://localhost:8081";
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // Short timeout to prevent hanging
      
      const response = await fetch(`${wsServerUrl}/public-url`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("Failed to fetch public URL from websocket server");
      }
      
      const data = await response.json();
      return NextResponse.json({ 
        publicUrl: data.publicUrl 
      });
    } catch (fetchError) {
      console.error("Error connecting to websocket server:", fetchError);
      // Provide fallback for build process
      const publicUrl = process.env.PUBLIC_URL || "";
      
      return NextResponse.json({ 
        publicUrl,
        error: "Could not connect to websocket server",
        status: "fallback"
      });
    }
  } catch (error) {
    console.error("Error in webhook-local route:", error);
    
    // Fallback for any other errors
    return NextResponse.json({ 
      publicUrl: process.env.PUBLIC_URL || "",
      error: "Error in webhook handler",
      status: "error"
    });
  }
}