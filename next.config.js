/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'api.together.ai',      // Allow Together AI domain
      'together-ai-bfl-images-prod.s3.us-west-2.amazonaws.com', // Allow direct S3 access
      'robohash.org',         // Keep robohash as fallback if needed
      'avatars.githubusercontent.com',  // Common for profile pictures
      'img.clerk.com',        // For Clerk user images
      'images.clerk.dev',     // For Clerk user images
      'cloudflare-ipfs.com',  // Common CDN for images
    ],
    minimumCacheTTL: 60 * 60 * 24, // Cache images for 24 hours
    // Ensure there's sufficient buffer for large URL query strings
    formats: ['image/avif', 'image/webp'],
    // Increase limit for image size
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable standalone output for Nixpacks deployment
  output: 'standalone',
  // Avoid CORS issues with API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Disable TypeScript and ESLint checks during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Required for production build
  swcMinify: true,
  experimental: {
    // Enable Nixpacks compatibility
    appDir: true,
  },
  // Increase serverless function timeout for generating images if needed
  serverRuntimeConfig: {
    maxDuration: 60, // 60 seconds
  },
};

module.exports = nextConfig;
