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

async function proxyFetch(req: NextRequest, init: RequestInit, suffix = '') {
  const targetUrl = `${TENANTS_ENDPOINT}${suffix}`;
  const response = await fetch(targetUrl, {
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

export async function GET(req: NextRequest) {
  return proxyFetch(req, { method: 'GET' }, req.nextUrl.search);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyFetch(req, { method: 'POST', body: JSON.stringify(body) });
}

