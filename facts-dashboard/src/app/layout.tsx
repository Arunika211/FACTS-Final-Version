import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Aktifkan dynamic rendering untuk mengatasi masalah fetch dengan revalidate: 0
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FACTS Dashboard - Monitoring Ternak",
  description: "Sistem monitoring ternak dengan teknologi sensor IoT dan AI",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' }
    ],
    apple: { url: '/apple-icon.png', type: 'image/png' }
  },
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  themeColor: '#1e40af'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
