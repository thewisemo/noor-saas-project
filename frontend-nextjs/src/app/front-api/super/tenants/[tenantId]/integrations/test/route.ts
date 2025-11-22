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

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  const body = await req.json().catch(() => ({}));
  const response = await fetch(`${SUPER_TENANTS_ENDPOINT}/${params.tenantId}/integrations/test`, {
    method: 'POST',
    headers: forwardHeaders(req),
    cache: 'no-store',
    body: JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || 'request_failed';
    return NextResponse.json({ message }, { status: response.status });
  }
  return NextResponse.json(payload, { status: response.status });
}

