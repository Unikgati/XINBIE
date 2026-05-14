import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar/index";
import BottomNav from "@/components/BottomNav/index";
import ClientProviders from "@/components/ClientProviders/index";
import AutoScrollToTop from "@/components/AutoScrollToTop";
import VisitTracker from "@/components/VisitTracker";

import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "XINBIE - Kebutuhan Gaya Hidup & Produk Pilihan",
    template: "%s | XINBIE"
  },
  description: "XINBIE menyediakan berbagai kebutuhan produk pilihan berkualitas tinggi, mulai dari perlengkapan kesehatan premium hingga kebutuhan harian lainnya dengan layanan pengiriman terbaik.",
  keywords: ["belanja online", "produk premium", "perlengkapan kesehatan", "korset lutut", "xinbie indonesia"],
  authors: [{ name: "XINBIE Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://xinbie.com",
    siteName: "XINBIE",
    title: "XINBIE - Kebutuhan Gaya Hidup & Produk Pilihan",
    description: "Temukan produk pilihan berkualitas tinggi dengan harga terbaik hanya di XINBIE. Pengiriman cepat ke seluruh Indonesia.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "XINBIE Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XINBIE - Kebutuhan Gaya Hidup & Produk Pilihan",
    description: "Belanja produk berkualitas tinggi dengan mudah dan aman di XINBIE.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
              <BottomNav />
            </div>
          </ClientProviders>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
