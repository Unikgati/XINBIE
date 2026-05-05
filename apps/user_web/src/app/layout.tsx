import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Dapurgizi User App",
  description: "Aplikasi pelanggan Dapurgizi",
};

import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import ClientProviders from "@/components/ClientProviders";
import AutoScrollToTop from "@/components/AutoScrollToTop";

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
      <body className={poppins.variable}>
        <ClientProviders>
          <AutoScrollToTop />
          <Navbar />
          <div className="app-container">
            {children}
            <BottomNav />
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
