import { NextRequest, NextResponse } from 'next/server';

const API_BASE =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiBaseUrl = API_BASE.replace(/\/$/, '');

const sanitizeUser = (user: any) => ({
  id: user?.id,
  name: user?.name,
  email: user?.email,
  role: user?.role,
  is_active: user?.is_active,
});

const sanitizePayload = (payload: any) => {
  if (Array.isArray(payload)) return payload.map(sanitizeUser);
  if (payload && typeof payload === 'object') return sanitizeUser(payload);
  return payload;
};

const headersFrom = (req: NextRequest) => {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers.authorization = auth;
  return headers;
};

async function proxy(req: NextRequest, tenantId: string, init: RequestInit) {
  const res = await fetch(`${apiBaseUrl}/tenants/${tenantId}/users`, {
    ...init,
    headers: headersFrom(req),
    cache: 'no-store',
  });
  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || 'request_failed';
    return NextResponse.json({ message }, { status: res.status });
  }
  return NextResponse.json(sanitizePayload(payload), { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return proxy(req, params.tenantId, { method: 'GET' });
}

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const body = await req.json().catch(() => ({}));
  return proxy(req, params.tenantId, { method: 'POST', body: JSON.stringify(body) });
}

