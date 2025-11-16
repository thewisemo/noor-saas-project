'use client';

import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Polygon, DrawingManager, useLoadScript } from '@react-google-maps/api';
import DashboardHeader from '@/components/layout/DashboardHeader';

type Zone = {
  id: string;
  name: string;
  delivery_fee: string;
  minimum_order_value: string;
  polygon: { coordinates: number[][][] };
};

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [draft, setDraft] = useState<{ lat: number; lng: number }[]>([]);
  const [form, setForm] = useState({ name: '', deliveryFee: '10', minimumOrderValue: '50' });
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsApiKey,
    libraries: ['drawing'],
    language: 'ar',
  });

  const [token, setToken] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '');
    }
  }, []);

  const fetchZones = useCallback(async () => {
    if (!apiUrl || !token) return;
    const res = await fetch(`${apiUrl}/zones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setZones(data);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath().getArray().map(latLng => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }));
    polygon.setMap(null);
    setDraft(path);
  }, []);

  const saveZone = useCallback(async () => {
    if (!apiUrl || !token) return;
    if (!form.name.trim() || draft.length < 3) {
      alert('أكمل البيانات وحدد المضلع');
      return;
    }
    setLoading(true);
    const res = await fetch(`${apiUrl}/zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name,
        polygon: draft,
        deliveryFee: Number(form.deliveryFee),
        minimumOrderValue: Number(form.minimumOrderValue),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      alert('تعذر حفظ المنطقة');
      return;
    }
    setForm({ name: '', deliveryFee: '10', minimumOrderValue: '50' });
    setDraft([]);
    fetchZones();
  }, [apiUrl, draft, fetchZones, form.name, form.deliveryFee, form.minimumOrderValue, token]);

  if (!mapsApiKey) {
    return <p className="p-6 text-red-400">يرجى ضبط المفتاح NEXT_PUBLIC_GOOGLE_MAPS_API_KEY قبل رسم المناطق.</p>;
  }

  if (loadError) {
    return <p className="p-6 text-red-400">تعذر تحميل خريطة جوجل. تحقق من المفتاح.</p>;
  }

  if (!isLoaded) {
    return <p className="p-6">جارٍ تحميل خريطة جوجل…</p>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DashboardHeader title="مناطق التغطية" />
      <main className="space-y-6 p-6">
        <section className="glass-panel">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-300">خرائط التوصيل</p>
            <h1 className="text-2xl font-semibold">ارسم نطاقاتك وحدّث رسوم التوصيل في الزمن الحقيقي.</h1>
            <p className="text-sm text-gray-200">استخدم أداة الرسم لتحديد الحدود الجغرافية ثم احفظها مباشرة في قاعدة البيانات.</p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card md:col-span-2">
          <div style={{ height: '500px' }}>
            <GoogleMap
              center={DEFAULT_CENTER}
              zoom={11}
              mapContainerStyle={{ width: '100%', height: '100%', borderRadius: 16 }}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              <DrawingManager
                onPolygonComplete={handlePolygonComplete}
                options={{
                  drawingControlOptions: {
                    drawingModes: ['polygon' as google.maps.drawing.OverlayType],
                  },
                  polygonOptions: {
                    fillColor: '#6C63FF',
                    fillOpacity: 0.2,
                    strokeWeight: 2,
                    strokeColor: '#6C63FF',
                  },
                }}
              />

              {draft.length > 2 && (
                <Polygon
                  path={draft}
                  options={{
                    fillColor: '#6C63FF',
                    fillOpacity: 0.15,
                    strokeColor: '#6C63FF',
                    strokeWeight: 2,
                  }}
                />
              )}

              {zones.map(zone => (
                <Polygon
                  key={zone.id}
                  path={zone.polygon?.coordinates?.[0]?.map(coord => ({ lng: coord[0], lat: coord[1] })) || []}
                  options={{
                    fillColor: '#22c55e',
                    fillOpacity: 0.15,
                    strokeColor: '#22c55e',
                    strokeWeight: 1,
                  }}
                />
              ))}
            </GoogleMap>
          </div>
        </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">بيانات المنطقة</h2>
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">الاسم</label>
              <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-gray-800 bg-transparent p-2 focus:border-accent focus:outline-none"
              placeholder="مثال: حي العليا"
            />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">رسوم التوصيل (ر.س)</label>
              <input
              type="number"
              value={form.deliveryFee}
              onChange={e => setForm(prev => ({ ...prev, deliveryFee: e.target.value }))}
                className="w-full rounded-xl border border-gray-800 bg-transparent p-2 focus:border-accent focus:outline-none"
            />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">الحد الأدنى للطلب (ر.س)</label>
              <input
              type="number"
              value={form.minimumOrderValue}
              onChange={e => setForm(prev => ({ ...prev, minimumOrderValue: e.target.value }))}
                className="w-full rounded-xl border border-gray-800 bg-transparent p-2 focus:border-accent focus:outline-none"
            />
            </div>
            <button
            onClick={saveZone}
            disabled={loading}
              className="w-full rounded-2xl bg-accent py-2 text-white disabled:opacity-60"
          >
            {loading ? 'جارٍ الحفظ…' : 'حفظ المنطقة'}
          </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">المناطق الحالية</h2>
          <div className="space-y-3">
            {zones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-sm text-gray-400">
                    رسوم التوصيل: {zone.delivery_fee} ر.س | الحد الأدنى: {zone.minimum_order_value} ر.س
                  </p>
                </div>
                <span className="rounded-full border border-gray-800 px-3 py-1 text-xs text-gray-400">
                  حد نقاط: {zone.polygon?.coordinates?.[0]?.length || 0}
                </span>
              </div>
            ))}
            {!zones.length && <p className="text-sm text-gray-400">لا توجد مناطق بعد.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

