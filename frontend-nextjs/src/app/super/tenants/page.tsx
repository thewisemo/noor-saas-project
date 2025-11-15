"use client";

import React, { useEffect, useMemo, useState } from "react";

type Tenant = {
  id?: string;
  name: string;
  slug?: string;
  domain?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// نثبت مسار الـ API على واجهة Next (مش /api/... الخاص بـ Nest)
const API = "/front-api/super/tenants";

// محاولة ذكية للحصول على التوكن من أكثر من مكان
function getToken(): string | undefined {
  try {
    const keys = ["token", "accessToken", "access_token"];
    for (const k of keys) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v) return v;
    }
    // من الكوكيز (Token=xxxx أو token=xxxx)
    const fromCookie =
      document.cookie
        .split(";")
        .map((x) => x.trim())
        .find((c) => /^token=|^Token=|^accessToken=|^access_token=/.test(c)) || "";
    if (fromCookie) {
      const m = fromCookie.split("=")[1];
      if (m) return decodeURIComponent(m);
    }
  } catch {}
  return undefined;
}

function authHeaders(): HeadersInit {
  const h: HeadersInit = {};
  const t = getToken();
  if (t) (h as any).Authorization = `Bearer ${t}`;
  return h;
}

export default function SuperTenantsPage() {
  const [list, setList] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const disabled = useMemo(
    () => loading || !name.trim(),
    [loading, name]
  );

  async function fetchTenants() {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: authHeaders(), cache: "no-store" });
      if (!res.ok) throw new Error(`GET tenants failed: ${res.status}`);
      const data = await res.json();
      const items: Tenant[] = Array.isArray(data) ? data : data?.items || [];
      setList(items);
    } catch (e) {
      console.error(e);
      alert("تعذّر تحميل المستأجرين (تأكد من صلاحيات التوكن ومسار الـ API).");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTenants();
  }, []);

  async function createTenant(payload: Pick<Tenant, "name" | "slug" | "domain">) {
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("POST ERR:", res.status, txt);
        throw new Error("POST /tenants failed");
      }
      // نجاح — نعيد التحميل
      await fetchTenants();
      setName("");
      setSlug("");
      setDomain("");
    } catch (e) {
      console.error(e);
      alert("تعذّر إضافة المستأجر (تأكد من صحة مسارات الـ API وصلاحيات التوكن).");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    const body = {
      name: name.trim(),
      slug: slug.trim() || undefined,   // API سيعمل slugify لو غير مُرسَل
      domain: domain.trim() || undefined,
    };
    createTenant(body);
  }

  function quickAddGhithak() {
    // إضافة سريعة لقيمة GHITHAK
    setName("GHITHAK");
    setSlug("ghithak");
    setDomain("ghithak.com.sa");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">المستأجرون</h1>

      {/* الحقول العلوية */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center mb-4">
        <input
          className="border rounded px-3 py-2 w-full md:w-1/3"
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
          dir="auto"
        />
        <input
          className="border rounded px-3 py-2 w-full md:w-1/3"
          placeholder="slug (اختياري)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          dir="ltr"
        />
        <input
          className="border rounded px-3 py-2 w-full md:w-1/3"
          placeholder="domain (اختياري)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          dir="ltr"
        />
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAdd}
          disabled={disabled}
          className={`px-4 py-2 rounded text-white ${
            disabled ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "جاري..." : "إضافة مستأجر"}
        </button>

        <button
          onClick={quickAddGhithak}
          className="px-4 py-2 rounded border border-green-600 text-green-700 hover:bg-green-50"
        >
          + GHITHAK
        </button>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-right">#</th>
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">slug</th>
              <th className="p-3 text-right">domain</th>
              <th className="p-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-right text-gray-500">
                  {loading ? "جارِ التحميل..." : "لا توجد بيانات."}
                </td>
              </tr>
            ) : (
              list.map((t, i) => (
                <tr key={t.id || `${t.name}-${i}`} className="border-t">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3" dir="auto">{t.name}</td>
                  <td className="p-3" dir="ltr">{t.slug || "-"}</td>
                  <td className="p-3" dir="ltr">{t.domain || "-"}</td>
                  <td className="p-3">{t.isActive ? "نشِط" : "مُعطّل"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
