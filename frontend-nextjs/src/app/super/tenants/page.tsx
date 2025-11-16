'use client';
import DashboardHeader from '@/components/layout/DashboardHeader';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '');
    }
  }, []);

  const http = useCallback(() => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return { headers };
  }, [token]);

  const apiBase = '/front-api/super/tenants';

  const loadTenants = useCallback(() => {
    if (!token) return;
    axios
      .get(apiBase, http())
      .then(r => setList(r.data))
      .catch(() => setList([]));
  }, [apiBase, http, token]);

  useEffect(() => {
    if (token) {
      loadTenants();
    }
  }, [loadTenants, token]);

  async function createTenant() {
    if (!form.name.trim()) return alert('اكتب اسم المستأجر');
    const payload: Record<string, string> = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value.trim()) payload[key] = value.trim();
    });
    const res = await axios.post(apiBase, payload, http());
    setList(prev => [...prev, res.data]);
    setForm(initialForm);
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
    const res = await axios.patch(`${apiBase}/${editingId}`, payload, http());
    setList(prev => prev.map(t => (t.id === editingId ? res.data : t)));
    setEditingId(null);
  }

  async function deleteTenant(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المستأجر؟')) return;
    await axios.delete(`${apiBase}/${id}`, http());
    setList(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DashboardHeader title="إدارة المستأجرين" />
      <main className="space-y-6 p-6">
        <section className="glass-panel">
          <div className="relative z-10 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-300">لوحة المستأجرين</p>
            <h2 className="text-2xl font-bold">تحكم كامل في دورة حياة المستأجرين.</h2>
            <p className="text-gray-200 text-sm">
              أضف مستأجرًا جديدًا، حدّث معلومات الاتصال، أو قم بإيقاف أي نطاق بشكل فوري من داخل هذه الواجهة الحديثة.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-accent/30 via-transparent to-emerald-400/10" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div className="card space-y-5">
            <div>
              <p className="text-lg font-semibold">إضافة مستأجر جديد</p>
              <p className="text-sm text-gray-400">أدخل بيانات المستأجر الأساسية ثم اضغط تسجيل.</p>
            </div>
            <div className="space-y-3">
              {['name', 'slug', 'domain', 'whatsappPhoneNumberId'].map(key => (
                <div key={key} className="space-y-1 text-sm">
                  <label className="text-gray-400">{labels[key as keyof typeof labels]}</label>
                  <input
                    className="w-full rounded-xl border border-gray-800 bg-transparent p-2 focus:border-accent focus:outline-none"
                    value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={createTenant}
              className="w-full rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90"
            >
              حفظ المستأجر
            </button>
          </div>

          <div className="card space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">جميع المستأجرين</p>
              <span className="text-sm text-gray-400">{list.length} عنصر</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-gray-400">
                    <th className="pb-3 text-right font-medium">الاسم</th>
                    <th className="pb-3 text-right font-medium">النطاق</th>
                    <th className="pb-3 text-right font-medium">واتساب</th>
                    <th className="pb-3 text-right font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {list.map(tenant => (
                    <tr key={tenant.id}>
                      <td className="py-3 font-semibold">{tenant.name}</td>
                      <td className="py-3 text-gray-400">{tenant.domain || '-'}</td>
                      <td className="py-3 text-gray-400 text-xs">{tenant.whatsappPhoneNumberId || '-'}</td>
                      <td className="py-3">
                        <div className="flex gap-2 text-xs">
                          <button
                            className="rounded-full border border-accent/60 px-3 py-1 text-accent"
                            onClick={() => startEdit(tenant)}
                          >
                            تعديل
                          </button>
                          <button
                            className="rounded-full border border-red-500/60 px-3 py-1 text-red-300"
                            onClick={() => deleteTenant(tenant.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr>
                      <td className="py-6 text-center text-gray-500" colSpan={4}>
                        لا يوجد مستأجرون حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {editingId && (
          <section className="card space-y-4 border-accent/50 shadow-lg shadow-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">تعديل المستأجر</p>
                <p className="text-sm text-gray-400">قم بتحديث البيانات واحفظها فورًا.</p>
              </div>
              <button className="text-sm text-gray-400 hover:text-white" onClick={() => setEditingId(null)}>
                إغلاق
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {['name', 'slug', 'domain', 'whatsappPhoneNumberId'].map(key => (
                <div key={key} className="space-y-1 text-sm">
                  <label className="text-gray-400">{labels[key as keyof typeof labels]}</label>
                  <input
                    className="w-full rounded-xl border border-gray-800 bg-transparent p-2 focus:border-accent focus:outline-none"
                    value={(editForm as any)[key]}
                    onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveEdit}
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90"
              >
                حفظ التعديلات
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="rounded-2xl border border-gray-800 px-4 py-2 text-sm text-gray-300"
              >
                تراجع
              </button>
            </div>
          </section>
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
