'use client'; import axios from 'axios'; import { useEffect, useState } from 'react';
export default function TenantsPage(){ const [list,setList]=useState<any[]>([]); const [name,setName]=useState('Ghithak Market');
  useEffect(()=>{ axios.get(process.env.NEXT_PUBLIC_API_URL + '/tenants').then(r=>setList(r.data)); },[]);
  async function create(){ const res=await axios.post(process.env.NEXT_PUBLIC_API_URL + '/tenants',{name}); setList(p=>[...p,res.data]); }
  return(<div className="space-y-4"><div className="card"><div className="flex gap-2"><input className="p-2 rounded bg-gray-900 border border-gray-700" value={name} onChange={e=>setName(e.target.value)} /><button className="px-4 bg-accent rounded" onClick={create}>إضافة مستأجر</button></div></div><div className="card"><h2 className="text-xl mb-2">المستأجرون</h2><ul className="space-y-2">{list.map(t=><li key={t.id} className="border-b border-gray-700 pb-2">{t.name}</li>)}</ul></div></div>);}
