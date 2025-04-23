export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js authentication routes)
     * - api/twilio (Twilio webhook endpoints)
     * - auth/signin (Sign-in page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|api/twilio|auth/signin|_next/static|_next/image|favicon.ico).*)",
  ],
};