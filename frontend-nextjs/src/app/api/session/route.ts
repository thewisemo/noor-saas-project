import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'token';

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: '' }));
  if (!token) return NextResponse.json({ ok: false, error: 'token-required' }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value || '';
  return NextResponse.json({ ok: !!token, token });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}