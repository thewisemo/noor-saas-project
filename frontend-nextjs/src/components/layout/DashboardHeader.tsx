'use client';

import { useRouter } from 'next/navigation';
import ThemeToggle from '../theme/ThemeToggle';
import Button from '@/components/ui/Button';
import { useMemo } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  accountName?: string;
  roleLabel?: string;
  status?: 'online' | 'idle' | 'offline';
};

const statusMap: Record<
  NonNullable<Props['status']>,
  { label: string; className: string }
> = {
  online: { label: 'متصل', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  idle: { label: 'مراقبة', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  offline: { label: 'غير متصل', className: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

export default function DashboardHeader({
  title,
  subtitle = 'منصة نور • GHITHAK متعددة المستأجرين',
  accountName = 'حساب نور',
  roleLabel = 'سوبر أدمن',
  status = 'online',
}: Props) {
  const router = useRouter();
  const statusBadge = useMemo(() => statusMap[status], [status]);

  const logout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      ['token', 'role', 'tenant_id'].forEach(key => localStorage.removeItem(key));
    }
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
            نور
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">Noor • GHITHAK</p>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold">{accountName}</p>
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <span>{roleLabel}</span>
              <span className="text-[var(--color-muted)]">•</span>
              <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>
          <ThemeToggle />
          <Button variant="danger" className="rounded-full px-5 py-2 text-xs" onClick={logout}>
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </header>
  );
}

