import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Request id_token from Google OAuth
          scope: "openid email profile"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the ID token to the token for IAM authentication
      if (account) {
        token.id_token = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Add ID token to session for client-side use
      // @ts-ignore - id_token is not in type definition
      session.id_token = token.id_token;
      return session;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        // Optional: Restrict to specific domains
        if (process.env.ALLOWED_DOMAINS) {
          const email = profile?.email as string;
          const domains = process.env.ALLOWED_DOMAINS.split(",");
          return domains.some(domain => email.endsWith(`@${domain}`));
        }
        return true;
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

export { handler as GET, handler as POST };