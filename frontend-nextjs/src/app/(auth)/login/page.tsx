'use client'; import axios from 'axios'; import { useState } from 'react';
export default function LoginPage() {
  const [email,setEmail]=useState('admin@noor.system'); const [password,setPassword]=useState('superadmin123'); const [msg,setMsg]=useState('');
  async function submit(e:any){ e.preventDefault(); try{
    const res=await axios.post(process.env.NEXT_PUBLIC_API_URL + '/auth/login',{email,password});
    localStorage.setItem('noor-token',res.data.token); setMsg('تم الدخول بنجاح ✅'); window.location.href='/super';
  }catch(e){ setMsg('فشل تسجيل الدخول'); } }
  return (<div className="max-w-md mx-auto card"><h1 className="text-2xl mb-4">تسجيل الدخول</h1>
    <form onSubmit={submit} className="space-y-3">
      <div><label className="block mb-1">الإيميل</label><input className="w-full p-2 rounded bg-gray-900 border border-gray-700" value={email} onChange={e=>setEmail(e.target.value)} /></div>
      <div><label className="block mb-1">كلمة المرور</label><input type="password" className="w-full p-2 rounded bg-gray-900 border border-gray-700" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      <button className="w-full p-2 bg-accent rounded text-white">دخول</button><p className="text-sm opacity-80">{msg}</p></form></div>);
}
