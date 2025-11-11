import "./globals.css";

function ThemeScript() {
  const js = `
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const enableDark = saved ? saved === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', enableDark);
    } catch {}
  `;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

export const metadata = { title: "Noor • GHITHAK", description: "Admin Console" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
