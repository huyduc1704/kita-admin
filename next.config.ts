import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_API_URL || 'http://localhost:4000/api'}/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
