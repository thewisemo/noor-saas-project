'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Image from 'next/image';
import { PRODUCT_NAME, productTagline, logoLight } from '@/config/branding';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@noor.system');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token') || '';
      const role = localStorage.getItem('role') || '';
      if (token && role) {
        if (role === 'SUPER_ADMIN') router.replace('/super/tenants');
        else router.replace('/admin');
      }
    } catch {
      /* ignore */
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d?.token) {
        setError(d?.message || 'فشل تسجيل الدخول، حاول مجددًا.');
        setLoading(false);
        return;
      }

      const role = d?.user?.role || '';
      const tenantId = d?.user?.tenant_id || '';

      localStorage.setItem('token', d.token);
      localStorage.setItem('role', role);
      localStorage.setItem('tenant_id', tenantId);

      const maxAge = 60 * 60 * 24 * 14;
      document.cookie = `token=${d.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `role=${role}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `tenant_id=${tenantId}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

      router.replace(role === 'SUPER_ADMIN' ? '/super/tenants' : '/admin');
    } catch (err) {
      console.error(err);
      setError('حصل خطأ غير متوقع. حاول لاحقًا.');
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-950 to-slate-900 px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(90,70,255,0.4),_transparent_50%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8">
        <div className="text-center space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">{PRODUCT_NAME}</p>
          <h1 className="text-4xl font-bold">مرحبًا بعودتك إلى {PRODUCT_NAME}</h1>
          <p className="text-sm text-white/70">{productTagline}</p>
        </div>

        <Card className="w-full max-w-md bg-white/95 text-gray-900 shadow-2xl backdrop-blur">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="text-center space-y-1">
              <div className="mx-auto flex h-16 w-32 items-center justify-center">
                <Image src={logoLight} alt={PRODUCT_NAME} width={120} height={48} className="object-contain" priority />
              </div>
              <p className="text-sm font-medium text-indigo-600">تسجيل الدخول إلى حساب {PRODUCT_NAME}</p>
              <h2 className="text-2xl font-bold text-gray-900">{PRODUCT_NAME}</h2>
              <p className="text-xs text-gray-500">{productTagline}</p>
            </div>

            {error && <Alert variant="danger" message={error} />}

            <Input label="البريد الإلكتروني" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جارٍ التحقق…' : 'تسجيل الدخول'}
            </Button>
            <p className="text-center text-xs text-gray-500">
              بدخولك فأنت توافق على{' '}
              <span className="font-semibold text-indigo-600">سياسات الخصوصية واستخدام المنصة</span>.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}