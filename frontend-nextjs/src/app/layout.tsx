import './globals.css';
import { ThemeProvider } from 'next-themes';
import Image from 'next/image';

export const metadata = {
  title: 'Noor',
  description: 'منصة نور لإدارة التوصيل',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <header className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Image src="/brand/noor-logo-light.svg" alt="Noor" width={120} height={32} />
            </div>
            <button
              onClick={() => {
                const el = document.documentElement;
                const dark = el.classList.contains('dark');
                el.classList.toggle('dark', !dark);
                localStorage.setItem('noor-theme', !dark ? 'dark' : 'light');
              }}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              تبديل النمط
            </button>
          </header>
          <main className="p-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
