import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// WebSocket paths that need to be proxied to the internal WebSocket server
const WS_PATHS = ['/logs', '/call', '/twiml', '/public-url', '/tools'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path matches any of our WebSocket paths
  if (WS_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    const wsServerUrl = process.env.WEBSOCKET_SERVER_URL || 'http://localhost:8081';
    
    // Create the URL for the WebSocket server
    const url = new URL(pathname, wsServerUrl);
    
    // Check if this is a WebSocket upgrade request
    const upgrade = request.headers.get('connection') === 'Upgrade';
    
    if (upgrade) {
      // For WebSocket upgrade requests, we need to return a special response
      // that Next.js will interpret as an instruction to upgrade to WebSocket
      return NextResponse.next();
    } else {
      // For regular HTTP requests, proxy them to the WebSocket server
      try {
        const method = request.method;
        const headers = new Headers(request.headers);
        
        // Remove host header to prevent host conflicts
        headers.delete('host');
        
        // Get the request body if it's a POST/PUT request
        const body = ['POST', 'PUT'].includes(method) 
          ? await request.text() 
          : undefined;
        
        // Forward the request to the WebSocket server
        const response = await fetch(url.toString(), {
          method,
          headers,
          body,
          redirect: 'manual',
        });
        
        // Copy the response from the WebSocket server
        const responseHeaders = new Headers(response.headers);
        
        // Make a new response
        const newResponse = new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
        
        return newResponse;
      } catch (error) {
        console.error(`Error proxying to ${url.toString()}:`, error);
        return NextResponse.json(
          { error: 'Failed to proxy request to WebSocket server' },
          { status: 500 }
        );
      }
    }
  }

  // Continue for all other requests
  return NextResponse.next();
}

export const config = {
  // Match all WebSocket paths
  matcher: ['/logs', '/call', '/twiml', '/public-url', '/tools', '/realtime/:path*'],
};