'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

const roleOptions = [
  { label: 'مشرف المستأجر', value: 'TENANT_ADMIN' },
  { label: 'فريق خدمة العملاء', value: 'AGENT' },
  { label: 'طاقم المتجر', value: 'STAFF' },
];

export default function StaffPage() {
  const router = useRouter();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role');
      const storedToken = localStorage.getItem('token') || '';
      setToken(storedToken);
      setRole(storedRole || '');
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/front-api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'تعذر تحميل المستخدمين');
        setUsers([]);
      } else {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && role) {
      loadUsers();
    }
  }, [token, role, loadUsers]);

  const createUser = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('جميع الحقول مطلوبة لإنشاء مستخدم جديد.');
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/front-api/admin/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'تعذر إنشاء المستخدم.');
      } else {
        setSuccess('تم إنشاء المستخدم بنجاح.');
        setForm({ name: '', email: '', password: '', role: form.role });
        loadUsers();
      }
    } catch (err) {
      console.error(err);
      setError('تعذر إنشاء المستخدم.');
    }
  };

  return (
    <AdminShell title="فريق العمل" subtitle="إدارة مستخدمي المستأجر">
      {error && <Alert variant="danger" message={error} />}
      {success && <Alert variant="success" message={success} />}

      <Card title="المستخدمون الحاليون">
        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">جارٍ التحميل…</p>
        ) : users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-[var(--color-muted)]">
                  <th className="pb-3 text-right font-medium">الاسم</th>
                  <th className="pb-3 text-right font-medium">البريد الإلكتروني</th>
                  <th className="pb-3 text-right font-medium">الدور</th>
                  <th className="pb-3 text-right font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="py-3 font-semibold">{user.name}</td>
                    <td className="py-3 text-[var(--color-muted)]">{user.email}</td>
                    <td className="py-3 text-[var(--color-muted)]">{user.role}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          user.is_active ? 'text-emerald-500 border-emerald-500/40' : 'text-red-500 border-red-500/40'
                        }`}
                      >
                        {user.is_active ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">لا يوجد مستخدمون بعد.</p>
        )}
      </Card>

      <Card title="إضافة عضو جديد" description="أرسل بيانات الدخول للمستخدم بعد الإنشاء.">
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="الاسم الكامل" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-[var(--color-muted)]">الدور</span>
            <select
              className="w-full rounded-2xl border border-[var(--color-border)] bg-transparent px-4 py-2 text-sm focus:border-[var(--color-primary)]"
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value} className="text-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="كلمة المرور المبدئية"
            type="text"
            value={form.password}
            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
            hint="يمكن للمستخدم تغييرها بعد تسجيل الدخول."
          />
        </div>
        <Button className="mt-4" onClick={createUser}>
          حفظ المستخدم
        </Button>
      </Card>
    </AdminShell>
  );
}

