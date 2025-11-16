export const metadata = { title: 'Noor' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html dir="rtl" lang="ar" className="theme-dark">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, "Noto Kufi Arabic", Arial' }}>
        {children}
      </body>
    </html>
  );
}
