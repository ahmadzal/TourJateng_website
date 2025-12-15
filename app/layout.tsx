import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import ProtectedNavbar from '../components/protected-navbar';
import ProtectedFooter from '../components/protected-footer';
import { AuthProvider } from '@/lib/auth-context';
import Head from 'next/head';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400', '700', '900'] });
export const metadata: Metadata = {
  title: 'TourJateng - Jelajahi Jawa Tengah',
  description: 'Platform wisata terbaik untuk menjelajahi keindahan Jawa Tengah'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head>
        {/* Step 2: Tambahkan stylesheet Pageclip */}
        <link
          rel="stylesheet"
          href="https://s.pageclip.co/v1/pageclip.css"
          media="screen"
        />
      </Head>

      <body className={inter.className}>
        <AuthProvider>
          <ProtectedNavbar />
          {children}
          <ProtectedFooter />
        </AuthProvider>

        {/* Step 1: Tambahkan script sebelum </body> */}
        <Script
          src="https://s.pageclip.co/v1/pageclip.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
