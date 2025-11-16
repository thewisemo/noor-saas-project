import './globals.css';
import type { ReactNode } from 'react';
import { Tajawal } from 'next/font/google';
import ThemeProviderWrapper from '@/components/theme/ThemeProviderWrapper';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-tajawal',
  weight: ['400', '500', '700'],
});

export const metadata = {
  title: 'Noor • GHITHAK',
  description: 'منصة نور متعددة المستأجرين لإدارة الطلبات، المناطق، والمحادثات.',
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
