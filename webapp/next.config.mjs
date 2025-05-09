/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
    WEBSOCKET_SERVER_URL: process.env.WEBSOCKET_SERVER_URL || "http://localhost:8081"
  },
  // Fix for window is not defined error
  reactStrictMode: true,
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true
  },
  // Add support for WebSocket proxying
  async rewrites() {
    return [
      {
        source: '/logs',
        destination: `${process.env.WEBSOCKET_SERVER_URL || 'http://localhost:8081'}/logs`,
      },
      {
        source: '/call',
        destination: `${process.env.WEBSOCKET_SERVER_URL || 'http://localhost:8081'}/call`,
      },
      {
        source: '/twiml',
        destination: `${process.env.WEBSOCKET_SERVER_URL || 'http://localhost:8081'}/twiml`,
      },
      {
        source: '/public-url',
        destination: `${process.env.WEBSOCKET_SERVER_URL || 'http://localhost:8081'}/public-url`,
      },
      {
        source: '/tools',
        destination: `${process.env.WEBSOCKET_SERVER_URL || 'http://localhost:8081'}/tools`,
      },
      {
        source: '/realtime/:path*',
        destination: `${process.env.WEBSOCKET_SERVER_URL || 'http://localhost:8081'}/realtime/:path*`,
      },
    ];
  },
  // Disable static optimization for certain paths and add output configuration
  output: 'standalone',
  experimental: {
    // Fix invalid value for outputFileTracingExcludes
    outputFileTracingExcludes: {
      '/api/**/*': []
    }
  }
};

export default nextConfig;
