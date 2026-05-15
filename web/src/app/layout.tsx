import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar/index";
import Footer from "@/components/Footer/index";
import ClientProviders from "@/components/ClientProviders/index";
import AutoScrollToTop from "@/components/AutoScrollToTop";
import VisitTracker from "@/components/VisitTracker";

import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://xinbie.com'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "XINBIE - Solusi Alat Terapi & Kesehatan Keluarga",
    template: "%s | XINBIE"
  },
  description: "Temukan alat terapi kesehatan premium mulai dari korset lutut, sabuk terapi, hingga kebutuhan wellness lainnya. Kualitas terbaik, harga terjangkau, kirim ke seluruh Indonesia.",
  keywords: ["alat terapi", "kesehatan", "korset lutut", "wellness", "xinbie indonesia", "gaya hidup sehat"],
  authors: [{ name: "XINBIE Team" }],
  robots: "index, follow",
  icons: {
    icon: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://xinbie.com",
    siteName: "XINBIE",
    title: "XINBIE - Solusi Alat Terapi & Kesehatan Keluarga",
    description: "Temukan alat terapi kesehatan premium dengan harga terbaik hanya di XINBIE. Pengiriman cepat ke seluruh Indonesia.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "XINBIE - Wellness in Motion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XINBIE - Solusi Alat Terapi & Kesehatan Keluarga",
    description: "Belanja alat terapi kesehatan berkualitas dengan mudah dan aman di XINBIE.",
    images: ["/og-image.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch WhatsApp number from settings
  let whatsappNumber = '6285961462361'; // Fallback
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/settings/whatsapp`, { 
      cache: 'no-store' 
    });
    const data = await res.json();
    if (data.whatsapp) {
      whatsappNumber = data.whatsapp;
    }
  } catch (e) {
    console.error('Failed to fetch WhatsApp setting:', e);
  }

  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className={plusJakartaSans.variable}>
        <GlobalErrorBoundary>
          <ClientProviders>
            <VisitTracker />
            <AutoScrollToTop />
            <Navbar />
            <div className="app-container">
              {children}
            </div>
            <Footer />

            {/* WhatsApp Floating Button */}
            <style>{`
              .whatsapp-float {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                background-color: #25D366;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                transition: transform 0.2s;
              }
              .whatsapp-float:hover {
                transform: scale(1.1);
              }
              @media (min-width: 1024px) {
                .whatsapp-float {
                  bottom: 30px;
                  right: 30px;
                }
              }
            `}</style>
            <a 
              href={`https://wa.me/${whatsappNumber}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="whatsapp-float"
              aria-label="Chat WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="30" height="30" fill="#fff">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l114.1-29.9c32.7 17.8 69.4 27.2 107 27.2h.1c122.4 0 222-99.6 222-222 0-59.3-23.1-115.1-65.2-157.2zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-67.4 17.6 18-65.7-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 54 81.2 54.1 130.5 0 101.8-82.7 184.6-184.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.5-27.5-16.4-14.6-27.5-32.7-30.7-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.5-9.2 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
            </a>
          </ClientProviders>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
