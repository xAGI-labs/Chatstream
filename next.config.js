/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Remove deprecated domains configuration
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'robohash.org',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Fix experimental configuration to use the updated property name
  experimental: {
    // Replace serverComponentsExternalPackages with serverExternalPackages
    serverExternalPackages: ['prisma', '@prisma/client'],
  }
};

module.exports = nextConfig;
