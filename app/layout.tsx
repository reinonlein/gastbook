import type { Metadata, Viewport } from 'next';
import { Roboto, Open_Sans, Montserrat, Inter } from 'next/font/google';
import ThemeProvider from '@/components/providers/ThemeProvider';
import FontProvider from '@/components/providers/FontProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';

// Import all fonts
const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
});

const openSans = Open_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-open-sans',
});

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
});

// Albert Sans is not available in Google Fonts, using Inter as alternative
const albertSans = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-albert-sans',
});

export const metadata: Metadata = {
  title: 'Gastbook',
  description: 'A social media platform',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gastbook',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4caf50',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
        {/* Vercel Analytics - automatically injected when deployed */}
      </head>
      <body className={`${roboto.variable} ${openSans.variable} ${montserrat.variable} ${albertSans.variable} font-albert-sans`}>
        <AuthProvider>
          <FontProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </FontProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

