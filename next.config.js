/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'placeholder.sauravalgs.workers.dev',
      'ui-avatars.com',
      'api.dicebear.com',
      'avatars.dicebear.com',
      'robohash.org'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
