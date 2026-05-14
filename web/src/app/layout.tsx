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

import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "Dapurgizi - Belanja Sayur & Kebutuhan Dapur Segar",
    template: "%s | Dapurgizi"
  },
  description: "Aplikasi belanja kebutuhan dapur segar, sayur, buah, dan daging dengan pengiriman cepat dan kualitas terjamin.",
  keywords: ["belanja sayur", "sayur online", "kebutuhan dapur", "sayur segar", "dapurgizi"],
  authors: [{ name: "Dapurgizi Team" }],
  robots: "index, follow",
};

import AIChat from "@/components/AIChat/index";
import NotificationInit from "@/components/NotificationInit/index";

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
            <AutoScrollToTop />
            <NotificationInit />
            <Navbar />
            <div className="app-container">
              {children}
              <BottomNav />
            </div>
            <AIChat />
          </ClientProviders>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
