import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from './lib/ThemeContext';
import { LanguageProvider } from './lib/LanguageContext';
import { AvatarProvider } from './lib/AvatarContext';
import Navbar from './components/Navbar';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import PreventZoom from './components/PreventZoom';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: 'Privátne Masáže & Vernostný systém',
  description: 'Exkluzívne rezervácie masáží a vernostný program odmien',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Masáže',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans"
      >
        <PreventZoom />
        <ThemeProvider>
          <LanguageProvider>
            <AvatarProvider>
              <Navbar />
              {children}
              <PwaInstallPrompt />
            </AvatarProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}