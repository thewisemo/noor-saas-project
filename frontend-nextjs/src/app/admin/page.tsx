'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';

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
    <div className="min-h-screen bg-[var(--bg)]">
      <DashboardHeader title="لوحة تحكم المستأجر" />
      <main className="space-y-6 p-6">
        <section className="glass-panel">
          <div className="relative z-10 space-y-2">
            <p className="text-xs text-gray-300 uppercase tracking-[0.3em]">العمليات اليومية</p>
            <h2 className="text-2xl font-bold">تابع طلباتك، مناطقك، ومحادثات عملائك من مكان واحد.</h2>
            <p className="text-sm text-gray-200">
              استخدم الروابط أدناه للانتقال إلى أهم مهامك اليومية أو استعرض التقارير السريعة لمعرفة حالة الطلبات.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/zones"
            className="card transition hover:-translate-y-0.5"
          >
            <p className="text-sm text-gray-400">المناطق</p>
            <p className="text-xl font-semibold">إدارة مناطق التغطية</p>
            <p className="text-xs text-gray-500">تحديث الرسوم والحدود الجغرافية بسهولة.</p>
          </Link>
          <div className="card">
            <p className="text-sm text-gray-400">الطلبات</p>
            <p className="text-xl font-semibold">تقارير اليوم</p>
            <p className="text-xs text-gray-500">سيتم عرضها قريبًا</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400">الفريق</p>
            <p className="text-xl font-semibold">المندوبون المتصلون</p>
            <p className="text-xs text-gray-500">سيتم عرضها قريبًا</p>
          </div>
        </section>
      </main>
    </div>
  );
}