"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [nameAr, setNameAr] = useState("غذائك ماركت");
  const [nameEn, setNameEn] = useState("GHITHAK Market");
  const [cash, setCash] = useState(true);
  const [card, setCard] = useState(true);
  const [addressLink, setAddressLink] = useState("");

  const save = async () => {
    alert("Saved (local) ✓ — الربط بالـAPI هنفعّله لاحقًا.");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="rounded-2xl border bg-white p-4 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm mb-1">اسم المتجر (عربي)</label>
          <input value={nameAr} onChange={e=>setNameAr(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Store name (English)</label>
          <input value={nameEn} onChange={e=>setNameEn(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cash} onChange={e=>setCash(e.target.checked)} /> Cash
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={card} onChange={e=>setCard(e.target.checked)} /> Card (Network)
          </label>
        </div>
        <div>
          <label className="block text-sm mb-1">عنوان العميل (رابط خرائط)</label>
          <input value={addressLink} onChange={e=>setAddressLink(e.target.value)} placeholder="Google / Apple / WhatsApp link" className="w-full rounded-lg border px-3 py-2" />
          <p className="text-xs text-gray-500 mt-1">سنتحقق لاحقًا ونستخرج الإحداثيات تلقائيًا.</p>
        </div>
        <button onClick={save} className="rounded-lg bg-green-600 text-white px-4 py-2">Save</button>
      </div>
    </div>
  );
}
