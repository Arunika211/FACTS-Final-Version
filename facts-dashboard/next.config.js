/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Konfigurasi untuk Image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.hf.space',
      },
    ],
    unoptimized: true, // Untuk static export
  },
  
  // Melewati error TypeScript dan ESLint
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Hapus konfigurasi yang tidak diperlukan untuk Vercel
  // basePath: '/FACTS-Final-Version',
  // assetPrefix: '/FACTS-Final-Version/',
  // output: 'export',
  
  // Konfigurasi server-side rendering dan dynamic fetching
  experimental: {
    serverActions: true,
  },
  
  // Penting: Tetapkan runtime untuk app router
  serverRuntimeConfig: {
    // Konfigurasi yang hanya digunakan di server
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://arunika211-facts-api.hf.space',
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' }
        ]
      }
    ];
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : 'http://localhost:5000/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 