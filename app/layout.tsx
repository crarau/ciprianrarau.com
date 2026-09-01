import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { PostHogProvider } from '@/components/PostHogProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ciprianrarau.com'),
  title: {
    default: 'Ciprian (Chip) Rarau — Founder, building a portfolio of products',
    template: '%s · Ciprian Rarau',
  },
  description:
    'I run a portfolio of products and collaborate with several companies in parallel. Across my own ventures and the companies I build with, the same problems keep showing up. Three instances of the same problem becomes a product.',
  authors: [{ name: 'Ciprian (Chip) Rarau' }],
  creator: 'Ciprian (Chip) Rarau',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Ciprian (Chip) Rarau',
    url: 'https://ciprianrarau.com',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@ciprianrarau',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F4F1' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1916' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
