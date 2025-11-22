import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
  .replace(/\/$/, '');
const SUPER_TENANTS_ENDPOINT = `${API_BASE}/super/tenants`;

const forwardHeaders = (req: NextRequest) => {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers.authorization = auth;
  return headers;
};

async function proxy(req: NextRequest, init: RequestInit, tenantId: string) {
  const response = await fetch(`${SUPER_TENANTS_ENDPOINT}/${tenantId}/integrations`, {
    ...init,
    headers: forwardHeaders(req),
    cache: 'no-store',
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || 'request_failed';
    return NextResponse.json({ message }, { status: response.status });
  }
  return NextResponse.json(payload, { status: response.status });
}

export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return proxy(req, { method: 'GET' }, params.tenantId);
}

export async function PUT(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const body = await req.json().catch(() => ({}));
  return proxy(req, { method: 'PUT', body: JSON.stringify(body) }, params.tenantId);
}
