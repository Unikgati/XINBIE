import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DapurGizi User App",
  description: "Aplikasi pelanggan DapurGizi",
};

import Navbar from "@/components/Navbar";
import ClientProviders from "@/components/ClientProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ClientProviders>
          <Navbar />
          <div className="app-container">
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
