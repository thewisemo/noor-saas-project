'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@noor.system'); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token') || '';
      const role = localStorage.getItem('role') || '';
      if (token && role) {
        if (role === 'SUPER_ADMIN') router.replace('/super/tenants');
        else router.replace('/admin');
      }
    } catch {}
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });

      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d?.token) {
        alert(d?.message || 'فشل تسجيل الدخول');
        setLoading(false);
        return;
      }

      const role = d?.user?.role || '';
      const tenantId = d?.user?.tenant_id || '';

      localStorage.setItem('token', d.token);
      localStorage.setItem('role', role);
      localStorage.setItem('tenant_id', tenantId);

      const maxAge = 60 * 60 * 24 * 14; // 14 يوم
      document.cookie = `token=${d.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `role=${role}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `tenant_id=${tenantId}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

      if (role === 'SUPER_ADMIN') router.replace('/super/tenants');
      else router.replace('/admin');

    } catch (err) {
      console.error(err);
      alert('حصل خطأ غير متوقع');
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0b0b0b',color:'#fff'}}>
      <form onSubmit={onSubmit} style={{width:360,maxWidth:'90vw',background:'#121212',padding:24,borderRadius:12,boxShadow:'0 0 0 1px #222 inset'}}>
        <h2 style={{textAlign:'center',marginBottom:16}}>تسجيل الدخول</h2>

        <label style={{display:'block',margin:'8px 0 4px'}}>الإيميل</label>
        <input
          value={email}
          onChange={e=>setEmail(e.target.value)}
          type="email"
          required
          style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #333',background:'#0f0f0f',color:'#fff'}}
        />

        <label style={{display:'block',margin:'12px 0 4px'}}>كلمة المرور</label>
        <input
          value={password}
          onChange={e=>setPassword(e.target.value)}
          type="password"
          required
          style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #333',background:'#0f0f0f',color:'#fff'}}
        />

        <button
          disabled={loading}
          style={{width:'100%',marginTop:16,padding:'10px 12px',borderRadius:8,border:'none',background:'#6c63ff',color:'#fff',cursor:'pointer'}}
        >
          {loading ? 'جارٍ الدخول…' : 'دخول'}
        </button>
      </form>
    </div>
  );
}