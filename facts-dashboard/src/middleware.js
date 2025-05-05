import { NextResponse } from 'next/server';

export function middleware(request) {
  // Kita hanya perlu memodifikasi permintaan yang menuju ke API backend
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Clone objek response untuk memodifikasi
    const response = NextResponse.next();
    
    // Pastikan header CORS disertakan
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Set cache control header untuk mengatasi masalah caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  }
  
  return NextResponse.next();
}

// Konfigurasi jalur yang akan ditangani oleh middleware
export const config = {
  matcher: [
    // Jalur API
    '/api/:path*',
    // Hindari middleware di jalur statis
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 