import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles: BFF auth routes xử lý trước rewrite
      beforeFiles: [],
      // afterFiles: rewrite cho tất cả /api/* trừ /api/auth/* (đã có BFF routes)
      afterFiles: [
        {
          source: '/api/:path((?!auth/).*)',
          destination: `${process.env.BACKEND_API_URL || 'http://localhost:4000/api'}/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
