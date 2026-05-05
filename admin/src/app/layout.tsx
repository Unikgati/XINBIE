import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from "next/font/google";
import './globals.css';
import AppLayout from '@/components/AppLayout';
import Providers from '@/components/Providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: 'Dapur Gizi Admin',
  description: 'Panel admin untuk manajemen Dapur Gizi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className={plusJakartaSans.variable}>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
