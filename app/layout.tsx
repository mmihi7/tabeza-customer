import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import DeviceInitializer from '@/components/DeviceInitializer';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAUpdateManager from '@/components/PWAUpdateManager';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/contexts/AuthContext';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tabeza v2.0',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Mono:wght@300;400;500&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DeviceInitializer>
          <AuthProvider>
            <ToastProvider>
              <PWAInstallPrompt />
              <PWAUpdateManager />
              {children}
            </ToastProvider>
          </AuthProvider>
        </DeviceInitializer>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}