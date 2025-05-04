/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify dinonaktifkan karena tidak kompatibel dengan Next.js 15.3.1
  
  // Konfigurasi untuk Image
  images: {
    domains: [],
    unoptimized: true, // Untuk static export
  },
  
  // Konfigurasi untuk GitHub Pages
  basePath: '/FACTS-Final-Version', // Ganti dengan nama repo GitHub Anda
  assetPrefix: '/FACTS-Final-Version/', // Ganti dengan nama repo GitHub Anda
  
  // Gunakan output statis
  output: 'export',
  
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