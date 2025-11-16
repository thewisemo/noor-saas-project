import './globals.css';
import type { ReactNode } from 'react';
import { Tajawal } from 'next/font/google';
import ThemeProviderWrapper from '@/components/theme/ThemeProviderWrapper';
import { PRODUCT_NAME, productTagline } from '@/config/branding';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-tajawal',
  weight: ['400', '500', '700'],
});

export const metadata = {
  title: PRODUCT_NAME,
  description: productTagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html dir="rtl" lang="ar" suppressHydrationWarning>
      <body className={`${tajawal.variable} app-shell`}>
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </body>
    </html>
  );
}
