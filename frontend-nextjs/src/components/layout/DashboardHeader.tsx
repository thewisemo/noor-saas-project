'use client';

import { useRouter } from 'next/navigation';
import ThemeToggle from '../theme/ThemeToggle';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { useMemo, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PRODUCT_NAME, productTagline, logoDark, logoLight } from '@/config/branding';

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
  subtitle = productTagline,
  accountName = PRODUCT_NAME,
  roleLabel = 'سوبر أدمن',
  status = 'online',
}: Props) {
  const router = useRouter();
  const statusBadge = useMemo(() => statusMap[status], [status]);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
          <div className="relative h-12 w-32">
            {mounted && (
              <Image
                src={theme === 'light' ? logoDark : logoLight}
                alt={PRODUCT_NAME}
                className="object-contain object-right"
                fill
                priority
              />
            )}
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-muted)]">{PRODUCT_NAME}</p>
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

