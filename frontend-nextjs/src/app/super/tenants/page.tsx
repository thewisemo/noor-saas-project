'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DashboardHeader from '@/components/layout/DashboardHeader';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { PRODUCT_NAME } from '@/config/branding';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  whatsappPhoneNumberId?: string | null;
};

type TenantIntegration = {
  tenantId: string;
  whatsappPhoneNumberId?: string | null;
  whatsappAccessToken?: string | null;
  whatsappLastStatus?: string;
  whatsappLastError?: string | null;
  whatsappCheckedAt?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
  aiLastStatus?: string;
  aiLastError?: string | null;
  aiCheckedAt?: string | null;
};

type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
};

const initialForm = { name: '', slug: '', domain: '', whatsappPhoneNumberId: '' };
const integrationInitial = { whatsappPhoneNumberId: '', whatsappAccessToken: '', aiApiKey: '', aiModel: '' };

export default function TenantsPage() {
  const [list, setList] = useState<Tenant[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerTenant, setDrawerTenant] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [tenantUsersLoading, setTenantUsersLoading] = useState(false);
  const [tenantUsersError, setTenantUsersError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ fullName: '', email: '', initialPassword: '' });
  const [integrationTenant, setIntegrationTenant] = useState<Tenant | null>(null);
  const [integrationForm, setIntegrationForm] = useState(integrationInitial);
  const [integrationState, setIntegrationState] = useState<TenantIntegration | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [integrationSuccess, setIntegrationSuccess] = useState<string | null>(null);

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

  const jsonHeaders = useCallback(() => ({
    ...http().headers,
    'Content-Type': 'application/json',
  }), [http]);

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

  const loadIntegration = async (tenant: Tenant) => {
    setIntegrationTenant(tenant);
    setIntegrationLoading(true);
    setIntegrationError(null);
    setIntegrationSuccess(null);
    try {
      const res = await axios.get(`${apiBase}/${tenant.id}/integrations`, http());
      setIntegrationForm({
        whatsappPhoneNumberId: res.data.whatsappPhoneNumberId || '',
        whatsappAccessToken: res.data.whatsappAccessToken || '',
        aiApiKey: res.data.aiApiKey || '',
        aiModel: res.data.aiModel || '',
      });
      setIntegrationState(res.data);
    } catch (err: any) {
      setIntegrationError(err?.response?.data?.message || 'تعذر تحميل بيانات التكامل');
    } finally {
      setIntegrationLoading(false);
    }
  };

  const saveIntegration = async () => {
    if (!integrationTenant) return;
    setIntegrationLoading(true);
    setIntegrationError(null);
    setIntegrationSuccess(null);
    try {
      const res = await axios.put(`${apiBase}/${integrationTenant.id}/integrations`, integrationForm, http());
      setIntegrationState(res.data);
      setIntegrationSuccess('تم تحديث بيانات التكامل بنجاح.');
      loadTenants();
    } catch (err: any) {
      setIntegrationError(err?.response?.data?.message || 'تعذر حفظ بيانات التكامل');
    } finally {
      setIntegrationLoading(false);
    }
  };

  const testIntegration = async (target: 'whatsapp' | 'ai') => {
    if (!integrationTenant) return;
    setIntegrationLoading(true);
    setIntegrationError(null);
    setIntegrationSuccess(null);
    try {
      const headers = http().headers as Record<string, string>;
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${apiBase}/${integrationTenant.id}/integrations/test`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIntegrationError(data?.message || 'فشل اختبار الاتصال');
      }
      await loadIntegration(integrationTenant);
      if (res.ok) {
        setIntegrationSuccess('تم تنفيذ اختبار الاتصال.');
      }
    } catch (err) {
      console.error(err);
      setIntegrationError('تعذر تنفيذ اختبار الاتصال');
    } finally {
      setIntegrationLoading(false);
    }
  };

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

  const openTenantUsers = (tenant: Tenant) => {
    setDrawerTenant(tenant);
    setUserForm({ fullName: '', email: '', initialPassword: '' });
    setUserSuccess(null);
    loadTenantUsers(tenant.id);
  };

  const loadTenantUsers = async (tenantId: string) => {
    setTenantUsersLoading(true);
    setTenantUsersError(null);
    try {
      const res = await fetch(`/front-api/super/tenants/${tenantId}/users`, {
        headers: http().headers,
      });
      const data = await res.json();
      if (!res.ok) {
        setTenantUsersError(data?.message || 'تعذر تحميل المستخدمين');
        setTenantUsers([]);
      } else {
        const admins = Array.isArray(data) ? data.filter((user: TenantUser) => user.role === 'TENANT_ADMIN') : [];
        setTenantUsers(admins);
      }
    } catch (err) {
      console.error(err);
      setTenantUsersError('تعذر تحميل المستخدمين');
    } finally {
      setTenantUsersLoading(false);
    }
  };

  const createTenantAdmin = async () => {
    if (!drawerTenant) return;
    if (!userForm.fullName.trim() || !userForm.email.trim() || !userForm.initialPassword.trim()) {
      setTenantUsersError('أكمل جميع الحقول لإنشاء المستخدم.');
      return;
    }
    setTenantUsersError(null);
    setUserSuccess(null);
    try {
      const res = await fetch(`/front-api/super/tenants/${drawerTenant.id}/users`, {
        method: 'POST',
        headers: jsonHeaders().headers,
        body: JSON.stringify({
          name: userForm.fullName,
          email: userForm.email,
          password: userForm.initialPassword,
          role: 'TENANT_ADMIN',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTenantUsersError(data?.message || 'تعذر إنشاء المستخدم');
      } else {
        setUserSuccess('تم إنشاء حساب مشرف للمستأجر. شارك البريد الإلكتروني وكلمة المرور المبدئية مع العميل بطريقة آمنة.');
        setUserForm({ fullName: '', email: '', initialPassword: '' });
        loadTenantUsers(drawerTenant.id);
      }
    } catch (err) {
      console.error(err);
      setTenantUsersError('تعذر إنشاء المستخدم');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <DashboardHeader title="منصة نور – إدارة المستأجرين" accountName={`${PRODUCT_NAME} HQ`} roleLabel="سوبر أدمن" />
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
                          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => loadIntegration(tenant)}>
                            التكاملات
                          </Button>
                          <Button variant="ghost" className="px-3 py-1 text-xs" onClick={() => openTenantUsers(tenant)}>
                            حسابات الإدارة
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

        {integrationTenant && (
          <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 py-8 backdrop-blur-sm">
            <Card
              title={`تكاملات ${integrationTenant.name}`}
              description="تحديث مفاتيح واتساب والذكاء الاصطناعي واختبار الاتصال."
              className="w-full max-w-4xl"
              actions={
                <button
                  className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  onClick={() => {
                    setIntegrationTenant(null);
                    setIntegrationForm(integrationInitial);
                    setIntegrationError(null);
                    setIntegrationSuccess(null);
                  }}
                >
                  إغلاق
                </button>
              }
            >
              {integrationError && <Alert variant="danger" message={integrationError} className="mb-3" />}
              {integrationSuccess && <Alert variant="success" message={integrationSuccess} className="mb-3" />}

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="WhatsApp Phone ID"
                  value={integrationForm.whatsappPhoneNumberId}
                  onChange={e => setIntegrationForm(prev => ({ ...prev, whatsappPhoneNumberId: e.target.value }))}
                />
                <Input
                  label="WhatsApp Access Token"
                  type="password"
                  value={integrationForm.whatsappAccessToken}
                  onChange={e => setIntegrationForm(prev => ({ ...prev, whatsappAccessToken: e.target.value }))}
                />
                <Input
                  label="OpenAI API Key"
                  type="password"
                  value={integrationForm.aiApiKey}
                  onChange={e => setIntegrationForm(prev => ({ ...prev, aiApiKey: e.target.value }))}
                />
                <Input
                  label="OpenAI Model"
                  value={integrationForm.aiModel}
                  onChange={e => setIntegrationForm(prev => ({ ...prev, aiModel: e.target.value }))}
                  placeholder="gpt-4o-mini"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={saveIntegration} disabled={integrationLoading} className="flex-1 sm:flex-none sm:px-6">
                  {integrationLoading ? 'جارٍ الحفظ…' : 'حفظ بيانات التكامل'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => testIntegration('whatsapp')}
                  disabled={integrationLoading}
                  className="flex-1 sm:flex-none sm:px-6"
                >
                  اختبار واتساب
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => testIntegration('ai')}
                  disabled={integrationLoading}
                  className="flex-1 sm:flex-none sm:px-6"
                >
                  اختبار الذكاء الاصطناعي
                </Button>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)] md:grid-cols-2">
                <div>
                  <p className="font-semibold text-[var(--color-text)]">واتساب</p>
                  <p>الحالة: {integrationState?.whatsappLastStatus || 'غير معروف'}</p>
                  <p>
                    آخر فحص:{' '}
                    {integrationState?.whatsappCheckedAt
                      ? new Date(integrationState.whatsappCheckedAt).toLocaleString()
                      : '—'}
                  </p>
                  {integrationState?.whatsappLastError && <p className="text-red-500">{integrationState.whatsappLastError}</p>}
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">الذكاء الاصطناعي</p>
                  <p>الحالة: {integrationState?.aiLastStatus || 'غير معروف'}</p>
                  <p>
                    آخر فحص:{' '}
                    {integrationState?.aiCheckedAt ? new Date(integrationState.aiCheckedAt).toLocaleString() : '—'}
                  </p>
                  {integrationState?.aiLastError && <p className="text-red-500">{integrationState.aiLastError}</p>}
                </div>
              </div>
            </Card>
          </div>
        )}

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

      {drawerTenant && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-muted)]">إدارة المستخدمين</p>
                <h3 className="text-xl font-bold">{drawerTenant.name}</h3>
              </div>
              <button className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]" onClick={() => setDrawerTenant(null)}>
                إغلاق
              </button>
            </div>

            {tenantUsersError && <Alert variant="danger" message={tenantUsersError} className="mb-4" />}
            {userSuccess && <Alert variant="success" message={userSuccess} className="mb-4" />}

            <Card
              title="المستخدمون الحاليون"
              description="يمكن لكل مستأجر أن يمتلك أكثر من مشرف واحد. القائمة تعرض حسابات Tenant Admin فقط."
              className="bg-[var(--color-card)]"
            >
              {tenantUsersLoading ? (
                <p className="text-sm text-[var(--color-muted)]">جارٍ التحميل…</p>
              ) : tenantUsers.length ? (
                <ul className="space-y-2 text-sm">
                  {tenantUsers.map(user => (
                    <li key={user.id} className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-[var(--color-muted)]">{user.email}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        الدور: <span className="font-semibold text-[var(--color-text)]">{user.role}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">لا يوجد مستخدمون بعد.</p>
              )}
            </Card>

            <Card title="إضافة مشرف للمستأجر" description="أنشئ حساب Tenant Admin جديد." className="mt-4">
              <div className="space-y-3">
                <Input
                  label="الاسم الكامل"
                  value={userForm.fullName}
                  onChange={e => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                />
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  label="كلمة المرور المبدئية"
                  type="text"
                  value={userForm.initialPassword}
                  onChange={e => setUserForm(prev => ({ ...prev, initialPassword: e.target.value }))}
                  hint="أرسل هذه الكلمة للمستأجر وسيقوم بتغييرها بعد تسجيل الدخول الأول."
                />
                <div className="text-xs text-[var(--color-muted)]">الدور: Tenant Admin</div>
              </div>
              <Button className="mt-4 w-full" onClick={createTenantAdmin} disabled={tenantUsersLoading}>
                حفظ الحساب
              </Button>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                بعد إنشاء الحساب، شارك البريد الإلكتروني وكلمة المرور المبدئية مع عميل المستأجر بطريقة آمنة.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

const labels: Record<string, string> = {
  name: 'اسم المستأجر',
  slug: 'المعرف (Slug)',
  domain: 'الدومين (اختياري)',
  whatsappPhoneNumberId: 'WhatsApp Phone ID',
};

