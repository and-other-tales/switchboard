/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || ""
  },
  // Set port to 8080 for Google Cloud Run
  serverOptions: {
    port: 8080
  }
};

export default nextConfig;
