'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminShell from '@/components/layout/AdminShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AdminHome() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token') || '';
      const role = localStorage.getItem('role') || '';
      if (!token) {
        router.replace('/login');
        return;
      }
      if (role === 'SUPER_ADMIN') {
        router.replace('/super/tenants');
        return;
      }
      setReady(true);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  if (!ready) return null;

  return (
    <AdminShell title="لوحة تحكم المستأجر" subtitle="تابع طلباتك، مناطقك، ومحادثات عملائك من مكان واحد.">
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/zones" className="card transition hover:-translate-y-0.5">
          <p className="text-sm text-[var(--color-muted)]">المناطق</p>
          <p className="text-xl font-semibold">إدارة مناطق التغطية</p>
          <p className="text-xs text-[var(--color-muted)]">تحديث الرسوم والحدود الجغرافية بسهولة.</p>
        </Link>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">الطلبات</p>
          <p className="text-xl font-semibold">تقارير اليوم</p>
          <p className="text-xs text-[var(--color-muted)]">سيتم عرضها قريبًا</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">الفريق</p>
          <p className="text-xl font-semibold">المندوبون المتصلون</p>
          <p className="text-xs text-[var(--color-muted)]">سيتم عرضها قريبًا</p>
        </Card>
      </div>

      <Card title="نظرة عامة على اليوم" description="اطلع على أبرز المهام السريعة.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'طلبات قيد التنفيذ', value: '18', tone: 'text-amber-500' },
            { label: 'محادثات نشطة', value: '7', tone: 'text-emerald-500' },
            { label: 'تنبيهات', value: '2', tone: 'text-red-500' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl border border-[var(--color-border)] p-4 text-right">
              <p className="text-sm text-[var(--color-muted)]">{item.label}</p>
              <p className={`text-3xl font-bold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="اختصارات"
        description="قم بتنفيذ أهم المهام بنقرة واحدة."
        actions={<span className="text-xs text-[var(--color-muted)]">قريبًا المزيد</span>}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" className="flex-1 min-w-[220px]" onClick={() => router.push('/service')}>
            فتح مركز خدمة العملاء
          </Button>
          <Button variant="secondary" className="flex-1 min-w-[220px]" onClick={() => router.push('/admin/zones')}>
            تحديث رسوم التوصيل
          </Button>
        </div>
      </Card>
    </AdminShell>
  );
}