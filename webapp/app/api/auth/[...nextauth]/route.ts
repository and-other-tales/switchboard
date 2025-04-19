import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
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
