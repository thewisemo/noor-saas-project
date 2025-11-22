'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

type IntegrationStatus = {
  connected: boolean;
  lastStatus?: string;
  lastError?: string | null;
  checkedAt?: string;
};

export default function AdminSettings() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<IntegrationStatus | null>(null);
  const [ai, setAi] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token') || '';
      const storedRole = localStorage.getItem('role') || '';
      setToken(storedToken);
      setRole(storedRole);
      if (!storedToken) {
        router.replace('/login');
        return;
      }
      if (storedRole === 'SUPER_ADMIN') {
        router.replace('/super/tenants');
        return;
      }
    }
  }, [router]);

  const loadStatuses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/front-api/admin/integrations', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'تعذر تحميل حالة التكاملات');
        setWhatsapp(null);
        setAi(null);
      } else {
        setWhatsapp(data?.whatsapp || null);
        setAi(data?.ai || null);
      }
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل حالة التكاملات');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && role && role !== 'SUPER_ADMIN') {
      loadStatuses();
    }
  }, [loadStatuses, role, token]);

  const triggerTest = async (target: 'whatsapp' | 'ai') => {
    setTesting(target);
    setError(null);
    try {
      const res = await fetch('/front-api/admin/integrations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'فشل اختبار الاتصال');
      }
      await loadStatuses();
    } catch (err) {
      console.error(err);
      setError('تعذر إجراء الاختبار');
    } finally {
      setTesting(null);
    }
  };

  return (
    <AdminShell title="الإعدادات" subtitle="تابع جاهزية تكامل واتساب والذكاء الاصطناعي">
      {error && <Alert variant="danger" message={error} />}

      <div className="grid gap-4 md:grid-cols-2">
        <StatusCard
          title="تكامل واتساب"
          status={whatsapp}
          loading={loading}
          onTest={() => triggerTest('whatsapp')}
          testing={testing === 'whatsapp'}
        />
        <StatusCard
          title="تكامل الذكاء الاصطناعي"
          status={ai}
          loading={loading}
          onTest={() => triggerTest('ai')}
          testing={testing === 'ai'}
        />
      </div>
    </AdminShell>
  );
}

function StatusCard({
  title,
  status,
  loading,
  onTest,
  testing,
}: {
  title: string;
  status: IntegrationStatus | null;
  loading: boolean;
  onTest: () => void;
  testing: boolean;
}) {
  const connected = status?.connected ?? false;
  return (
    <Card title={title} description="عرض الحالة دون كشف المفاتيح">
      <div className="space-y-2">
        <p className="text-sm text-[var(--color-muted)]">
          الحالة الحالية: <span className={connected ? 'text-emerald-600' : 'text-red-500'}>{connected ? 'متصل' : 'غير متصل'}</span>
        </p>
        <p className="text-xs text-[var(--color-muted)]">آخر تحديث: {status?.checkedAt ? new Date(status.checkedAt).toLocaleString() : '—'}</p>
        {status?.lastError && <p className="text-xs text-red-500">{status.lastError}</p>}
        <Button variant="secondary" onClick={onTest} disabled={loading || testing}>
          {testing ? 'جارٍ الاختبار…' : 'اختبار الاتصال'}
        </Button>
      </div>
    </Card>
  );
}
