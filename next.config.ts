import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'hackwire.news' }],
        destination: 'https://www.hackwire.news/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
