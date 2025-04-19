/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    WEBSOCKET_URL: process.env.WEBSOCKET_URL || '',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  },
};

export default nextConfig;
