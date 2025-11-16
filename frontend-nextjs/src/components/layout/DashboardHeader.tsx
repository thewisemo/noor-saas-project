'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../theme/ThemeToggle';

export default function DashboardHeader({ title }: { title?: string }) {
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
    } catch {}
    if (typeof window !== 'undefined') {
      ['token', 'role', 'tenant_id'].forEach(key => localStorage.removeItem(key));
    }
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--panel)]/90 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Image src="/brand/noor-logo-light.svg" alt="Noor" width={120} height={32} className="hidden md:block" />
        <div>
          <p className="text-lg font-semibold">{title || 'مركز تحكم نور'}</p>
          <p className="text-xs text-gray-400">متعددة المستأجرين • مراقبة فورية</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={logout}
          className="rounded-full border border-red-500/60 bg-red-500/15 px-4 py-1.5 text-xs font-medium text-red-100 hover:bg-red-500/25"
        >
          تسجيل الخروج
        </button>
      </div>
    </header>
  );
}

