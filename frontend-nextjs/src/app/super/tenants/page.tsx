'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DashboardHeader from '@/components/layout/DashboardHeader';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  whatsappPhoneNumberId?: string | null;
};

const initialForm = { name: '', slug: '', domain: '', whatsappPhoneNumberId: '' };

export default function TenantsPage() {
  const [list, setList] = useState<Tenant[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '');
    }
  }, []);

  const http = useCallback(() => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return { headers };
  }, [token]);

  const apiBase = '/front-api/super/tenants';

  const loadTenants = useCallback(() => {
    if (!token) return;
    axios
      .get(apiBase, http())
      .then(r => {
        setList(r.data);
        setError(null);
      })
      .catch(() => {
        setError('تعذر تحميل المستأجرين. حاول لاحقًا.');
        setList([]);
      });
  }, [apiBase, http, token]);

  useEffect(() => {
    if (token) loadTenants();
  }, [loadTenants, token]);

  async function createTenant() {
    if (!form.name.trim()) {
      setError('أدخل اسم المستأجر قبل الحفظ.');
      return;
    }
    setLoading(true);
    const payload: Record<string, string> = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value.trim()) payload[key] = value.trim();
    });
    try {
      const res = await axios.post(apiBase, payload, http());
      setList(prev => [...prev, res.data]);
      setForm(initialForm);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر إنشاء المستأجر، تحقق من البيانات.');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(tenant: Tenant) {
    setEditingId(tenant.id);
    setEditForm({
      name: tenant.name || '',
      slug: tenant.slug || '',
      domain: tenant.domain || '',
      whatsappPhoneNumberId: tenant.whatsappPhoneNumberId || '',
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    const payload: Record<string, string> = {};
    Object.entries(editForm).forEach(([key, value]) => {
      payload[key] = value.trim();
    });
    try {
      const res = await axios.patch(`${apiBase}/${editingId}`, payload, http());
      setList(prev => prev.map(t => (t.id === editingId ? res.data : t)));
      setEditingId(null);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'تعذر تعديل المستأجر.');
    }
  }

  async function deleteTenant(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المستأجر؟')) return;
    try {
      await axios.delete(`${apiBase}/${id}`, http());
      setList(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch {
      setError('تعذر حذف المستأجر، حاول مرة أخرى.');
    }
  }

  const stats = useMemo(
    () => [
      { label: 'إجمالي المستأجرين', value: list.length.toString() },
      { label: 'نطاقات مخصصة', value: `${list.filter(t => t.domain).length}` },
      { label: 'تكامل واتساب', value: `${list.filter(t => t.whatsappPhoneNumberId).length}` },
    ],
    [list],
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <DashboardHeader title="إدارة المستأجرين" accountName="Noor HQ" roleLabel="سوبر أدمن" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <PageHeader
          title="سيطر على المستأجرين، النطاقات، والتراخيص"
          subtitle="أضف مستأجرًا جديدًا، حدّث نطاقه أو اربطه بالواجهات الخارجية مباشرة."
          badge="مركز التحكم"
        />

        {error && <Alert variant="danger" message={error} />}

        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map(stat => (
            <Card key={stat.label} className="space-y-1 text-right">
              <p className="text-sm text-[var(--color-muted)]">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card
            title="قائمة المستأجرين"
            description="تابع نطاقاتهم وأرقام واتساب المرتبطة بهم."
            actions={<span className="text-xs text-[var(--color-muted)]">{list.length} عنصر</span>}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-[var(--color-muted)]">
                    <th className="pb-3 text-right font-medium">الاسم</th>
                    <th className="pb-3 text-right font-medium">النطاق</th>
                    <th className="pb-3 text-right font-medium">WhatsApp ID</th>
                    <th className="pb-3 text-right font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {list.map(tenant => (
                    <tr key={tenant.id}>
                      <td className="py-3 font-semibold">{tenant.name}</td>
                      <td className="py-3 text-[var(--color-muted)]">{tenant.domain || '—'}</td>
                      <td className="py-3 text-xs text-[var(--color-muted)]">
                        {tenant.whatsappPhoneNumberId || 'لم يتم تعيينه'}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2 text-xs">
                          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => startEdit(tenant)}>
                            تعديل
                          </Button>
                          <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => deleteTenant(tenant.id)}>
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr>
                      <td className="py-6 text-center text-[var(--color-muted)]" colSpan={4}>
                        لا يوجد مستأجرون حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="إضافة مستأجر جديد" description="أدخل البيانات الأساسية وانقر على حفظ.">
            <div className="space-y-3">
              {['name', 'slug', 'domain', 'whatsappPhoneNumberId'].map(key => (
                <Input
                  key={key}
                  label={labels[key as keyof typeof labels]}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                />
              ))}
            </div>
            <Button onClick={createTenant} className="mt-4 w-full" disabled={loading}>
              {loading ? 'جارٍ الحفظ…' : 'حفظ المستأجر'}
            </Button>
          </Card>
        </section>

        {editingId && (
          <Card
            title="تعديل المستأجر"
            description="قم بتحديث بيانات المستأجر الحالية واحفظها فورًا."
            actions={
              <button className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]" onClick={() => setEditingId(null)}>
                إغلاق
              </button>
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              {['name', 'slug', 'domain', 'whatsappPhoneNumberId'].map(key => (
                <Input
                  key={key}
                  label={labels[key as keyof typeof labels]}
                  value={(editForm as Record<string, string>)[key]}
                  onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={saveEdit} className="flex-1 sm:flex-none sm:px-6">
                حفظ التعديلات
              </Button>
              <Button variant="ghost" className="flex-1 sm:flex-none sm:px-6" onClick={() => setEditingId(null)}>
                تراجع
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

const labels: Record<string, string> = {
  name: 'اسم المستأجر',
  slug: 'المعرف (Slug)',
  domain: 'الدومين (اختياري)',
  whatsappPhoneNumberId: 'WhatsApp Phone ID',
};

