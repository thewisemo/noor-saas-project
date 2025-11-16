'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardHeader from './DashboardHeader';
import { cn } from '@/lib/cn';
import { PRODUCT_NAME } from '@/config/branding';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const navItems = [
  { label: 'الرئيسية', href: '/admin', icon: '🏠' },
  { label: 'فريق العمل', href: '/admin/staff', icon: '👥' },
  { label: 'مناطق التغطية', href: '/admin/zones', icon: '🗺️' },
  { label: 'الطلبات', href: '/admin/orders', icon: '🧾', disabled: true },
  { label: 'المندوبون', href: '/admin/drivers', icon: '🚚', disabled: true },
  { label: 'خدمة العملاء', href: '/service', icon: '💬' },
  { label: 'الإعدادات', href: '/admin/settings', icon: '⚙️', disabled: true },
];

export default function AdminShell({ title, subtitle, children }: Props) {
  const pathname = usePathname();
  const [tenantName, setTenantName] = useState('مستأجر نور');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tenant_name');
      const tenantId = localStorage.getItem('tenant_id');
      if (stored && stored.trim()) {
        setTenantName(stored);
      } else if (tenantId) {
        setTenantName(`Tenant #${tenantId.slice(-4)}`);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <DashboardHeader
        title={title}
        subtitle={subtitle ?? `حساب ${PRODUCT_NAME} الخاص بـ ${tenantName}`}
        accountName={`حساب ${tenantName}`}
        roleLabel="لوحة المستأجر"
        status="online"
      />

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8 sm:px-6">
        <aside className="hidden w-64 shrink-0 flex-col gap-2 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg shadow-black/5 lg:flex">
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 p-4 text-sm text-[var(--color-muted)]">
            <p className="text-base font-semibold text-[var(--color-text)]">قائمة التنقل</p>
            <p>انتقل سريعًا بين أهم المهام اليومية.</p>
          </div>
          <nav className="space-y-1 text-sm">
            {navItems.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-3 py-2 transition',
                    active
                      ? 'border-[var(--color-primary)] bg-gradient-to-l from-[var(--color-primary)]/15 text-[var(--color-primary)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text)]',
                    item.disabled && 'opacity-50 pointer-events-none',
                  )}
                >
                  <span className="flex items-center gap-2 text-base">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  {!item.disabled && active && <span className="text-xs text-[var(--color-primary)]">نشط</span>}
                  {item.disabled && <span className="text-[10px] text-[var(--color-muted)]">قريبًا</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}

