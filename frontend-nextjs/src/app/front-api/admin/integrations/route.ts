import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
  .replace(/\/$/, '');
const ENDPOINT = `${API_BASE}/admin/integrations`;

const headersFrom = (req: NextRequest) => {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers.authorization = auth;
  return headers;
};

async function proxy(req: NextRequest, init: RequestInit, suffix = '') {
  const res = await fetch(`${ENDPOINT}${suffix}`, {
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
  return NextResponse.json(payload, { status: res.status });
}

export async function GET(req: NextRequest) {
  return proxy(req, { method: 'GET' });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxy(req, { method: 'POST', body: JSON.stringify(body) }, '/test');
}
