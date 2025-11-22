import './globals.css';
import type { ReactNode } from 'react';
import ThemeProviderWrapper from '@/components/theme/ThemeProviderWrapper';
import { PRODUCT_NAME, productTagline } from '@/config/branding';

export const metadata = {
  title: PRODUCT_NAME,
  description: productTagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html dir="rtl" lang="ar" suppressHydrationWarning>
      <body className="app-shell">
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </body>
    </html>
  );
}
