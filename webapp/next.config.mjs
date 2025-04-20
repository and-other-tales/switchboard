/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    WEBSOCKET_URL: process.env.WEBSOCKET_URL || '',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    PUBLIC_URL: process.env.PUBLIC_URL || '',
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.WEBSOCKET_URL || '',
  },
  webpack: (config, { isServer }) => {
    // Completely exclude problematic node modules in client bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        http: false,
        https: false,
        path: false,
        crypto: false,
        stream: false,
        os: false,
        zlib: false,
      };
      
      // Add externals for Node.js modules
      config.externals = [...(config.externals || []), 
        { 
          'google-auth-library': 'commonjs google-auth-library',
          'node-fetch': 'commonjs node-fetch',
          'gaxios': 'commonjs gaxios',
          'fetch-blob': 'commonjs fetch-blob',
        }
      ];
    }
    return config;
  },
};

export default nextConfig;
