import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  .replace(/\/$/, '');

const TENANTS_ENDPOINT = `${API_BASE}/tenants`;

const forwardHeaders = (req: NextRequest) => {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) {
    headers.authorization = auth;
  }
  return headers;
};

async function proxyFetch(req: NextRequest, init: RequestInit, tenantId: string) {
  const response = await fetch(`${TENANTS_ENDPOINT}/${tenantId}`, {
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

export async function PATCH(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const body = await req.json().catch(() => ({}));
  return proxyFetch(req, { method: 'PATCH', body: JSON.stringify(body) }, params.tenantId);
}

export async function DELETE(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return proxyFetch(req, { method: 'DELETE' }, params.tenantId);
}

