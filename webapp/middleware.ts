import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude API routes from authentication check
  // Twilio webhook routes should remain accessible
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/twilio/webhook-local") ||
    pathname.startsWith("/api/twilio/numbers")
  ) {
    return NextResponse.next();
  }

  // IAM token verification is now done on the server-side only in API routes
  // For middleware, we'll rely on the NextAuth session
  
  // Check for user session token
  const token = await getToken({ req: request });

  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except public assets, api/auth, and _next
    "/((?!_next/static|_next/image|favicon.ico|api/auth|auth).*)",
  ],
};