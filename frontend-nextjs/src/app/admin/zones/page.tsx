'use client';

import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Polygon, DrawingManager, useLoadScript } from '@react-google-maps/api';
import AdminShell from '@/components/layout/AdminShell';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

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
  }, [apiUrl, draft, fetchZones, form.deliveryFee, form.minimumOrderValue, form.name, token]);

  const content = (
    <>
      <Card title="خرائط التوصيل" description="ارسم نطاقاتك وحدّث رسوم التوصيل في الزمن الحقيقي." className="md:col-span-2">
        <div style={{ height: '500px' }}>
          {isLoaded && (
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
                    fillColor: '#5A46FF',
                    fillOpacity: 0.2,
                    strokeWeight: 2,
                    strokeColor: '#5A46FF',
                  },
                }}
              />

              {draft.length > 2 && (
                <Polygon
                  path={draft}
                  options={{
                    fillColor: '#5A46FF',
                    fillOpacity: 0.15,
                    strokeColor: '#5A46FF',
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
          )}
        </div>
      </Card>

      <Card title="بيانات المنطقة" description="أدخل تفاصيل المنطقة قبل الحفظ.">
        <div className="space-y-3">
          <Input
            label="اسم المنطقة"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="مثال: حي العليا"
          />
          <Input
            label="رسوم التوصيل (ر.س)"
            type="number"
            value={form.deliveryFee}
            onChange={e => setForm(prev => ({ ...prev, deliveryFee: e.target.value }))}
          />
          <Input
            label="الحد الأدنى للطلب (ر.س)"
            type="number"
            value={form.minimumOrderValue}
            onChange={e => setForm(prev => ({ ...prev, minimumOrderValue: e.target.value }))}
          />
        </div>
        <Button onClick={saveZone} className="mt-4 w-full" disabled={loading}>
          {loading ? 'جارٍ الحفظ…' : 'حفظ المنطقة'}
        </Button>
      </Card>

      <Card title="المناطق الحالية">
        <div className="space-y-3">
          {zones.map(zone => (
            <div key={zone.id} className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <div>
                <p className="font-medium">{zone.name}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  رسوم التوصيل: {zone.delivery_fee} ر.س | الحد الأدنى: {zone.minimum_order_value} ر.س
                </p>
              </div>
              <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]">
                نقاط: {zone.polygon?.coordinates?.[0]?.length || 0}
              </span>
            </div>
          ))}
          {!zones.length && <p className="text-sm text-[var(--color-muted)]">لا توجد مناطق بعد.</p>}
        </div>
      </Card>
    </>
  );

  if (!mapsApiKey) {
    return (
      <AdminShell title="مناطق التغطية" subtitle="يرجى ضبط مفتاح خرائط جوجل قبل المتابعة.">
        <Alert variant="danger" message="يرجى ضبط المتغير NEXT_PUBLIC_GOOGLE_MAPS_API_KEY قبل رسم المناطق." />
      </AdminShell>
    );
  }

  if (loadError) {
    return (
      <AdminShell title="مناطق التغطية">
        <Alert variant="danger" message="تعذر تحميل خريطة جوجل. تحقق من المفتاح." />
      </AdminShell>
    );
  }

  if (!isLoaded) {
    return (
      <AdminShell title="مناطق التغطية">
        <Alert variant="info" message="جارٍ تحميل خريطة جوجل…" />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="مناطق التغطية" subtitle="ارسم نطاقاتك وحدّث رسوم التوصيل في الزمن الحقيقي.">
      <div className="grid gap-6 lg:grid-cols-3">{content}</div>
    </AdminShell>
  );
}
