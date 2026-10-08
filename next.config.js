/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    const rawTarget =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:7000';

    // Strip trailing /api or / so /api/:path* maps cleanly
    const cleanTarget = rawTarget.replace(/\/api\/?$/, '').replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${cleanTarget}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
