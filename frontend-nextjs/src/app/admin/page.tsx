'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <main style={{padding:24}}>
      <h2>لوحة تحكم المستأجر</h2>
      <ul style={{marginTop:12}}>
        <li><Link href="/admin/zones" style={{color:'#6C63FF'}}>إدارة مناطق التغطية</Link></li>
        <li>إحصاءات المبيعات (لاحقًا)</li>
      </ul>
    </main>
  );
}