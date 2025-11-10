'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function TenantsPage() {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');

  function auth() {
    const token = localStorage.getItem('token') || '';
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tenants`, auth())
      .then(r => setList(r.data))
      .catch(() => setList([]));
  }, []);

  async function create() {
    if (!name.trim()) return alert('اكتب اسم المستأجر');
    const body: any = { name: name.trim() };
    if (slug.trim()) body.slug = slug.trim();
    if (domain.trim()) body.domain = domain.trim();

    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tenants`, body, auth());
    setList(p => [...p, res.data]);
    setName(''); setSlug(''); setDomain('');
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex gap-2 flex-wrap">
          <input className="p-2 rounded bg-gray-900 border border-gray-700" placeholder="الاسم"
                 value={name} onChange={e=>setName(e.target.value)} />
          <input className="p-2 rounded bg-gray-900 border border-gray-700" placeholder="slug (اختياري)"
                 value={slug} onChange={e=>setSlug(e.target.value)} />
          <input className="p-2 rounded bg-gray-900 border border-gray-700" placeholder="domain (اختياري)"
                 value={domain} onChange={e=>setDomain(e.target.value)} />
          <button className="px-4 bg-accent rounded" onClick={create}>إضافة مستأجر</button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl mb-2">المستأجرون</h2>
        <ul className="space-y-2">
          {list.map(t => <li key={t.id} className="border-b border-gray-700 pb-2">{t.name}</li>)}
        </ul>
      </div>
    </div>
  );
}
