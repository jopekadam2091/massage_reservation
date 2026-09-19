import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'blobatar/motion.css';
import { ThemeProvider } from './lib/ThemeContext';
import { LanguageProvider } from './lib/LanguageContext';
import { AvatarProvider } from './lib/AvatarContext';
import Navbar from './components/Navbar';
import PwaInstallPrompt from './components/PwaInstallPrompt';

export const metadata: Metadata = {
  title: 'ZenFlow | Privátne Masáže & Vernostný systém',
  description: 'Exkluzívne rezervácie masáží a vernostný program odmien v štýle Evervault Dark Pulse',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Masáže',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#6633EE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-[#F4F6FB] dark:bg-[#010314] text-[#0B0D22] dark:text-[#FFFFFF] font-sans relative overflow-x-hidden selection:bg-[#6633EE] selection:text-white transition-colors duration-300"
      >
        <ThemeProvider>
          <LanguageProvider>
            <AvatarProvider>
              {/* ⚡ Evervault Dark Pulse & Light Mode Ambient Glowing Auras (Hardware Accelerated) */}
              <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[24rem] rounded-full bg-gradient-to-b from-[#6633EE]/15 dark:from-[#6633EE]/25 via-[#A78BFA]/10 dark:via-[#A78BFA]/15 to-transparent blur-[60px] sm:blur-[120px] pointer-events-none z-0 transform-gpu animate-blob-flow-1" />
              <div className="fixed top-1/3 -left-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-[#6633EE]/10 dark:from-[#6633EE]/20 via-[#4F46E5]/5 dark:via-[#4F46E5]/10 to-transparent blur-[70px] sm:blur-[140px] pointer-events-none z-0 transform-gpu animate-blob-flow-2" />
              <div className="fixed bottom-12 -right-32 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tl from-[#A78BFA]/10 dark:from-[#A78BFA]/15 via-[#6633EE]/10 dark:via-[#6633EE]/15 to-transparent blur-[70px] sm:blur-[140px] pointer-events-none z-0 transform-gpu animate-blob-flow-3" />

              <div className="relative z-10">
                <Navbar />
                {children}
                <PwaInstallPrompt />
              </div>
            </AvatarProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}