/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || (process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}` : 'http://localhost:8080'),
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-do-not-use-in-production',
  }
};

export default nextConfig;
