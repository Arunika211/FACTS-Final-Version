/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify dinonaktifkan karena tidak kompatibel dengan Next.js 15.3.1
  
  // Konfigurasi untuk Image
  images: {
    domains: [],
    unoptimized: true, // Untuk static export
  },
  
  // Hapus konfigurasi yang tidak diperlukan untuk Vercel
  // basePath: '/FACTS-Final-Version',
  // assetPrefix: '/FACTS-Final-Version/',
  // output: 'export',
  
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