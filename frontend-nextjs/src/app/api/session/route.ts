import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET: رجّع حالة الجلسة (اختياري)
export async function GET() {
  const token = cookies().get("token")?.value || "";
  return NextResponse.json({ authenticated: !!token });
}

// POST: خزّن التوكن في Cookie (اختياري للّوجين)
export async function POST(req: Request) {
  const { token, role } = await req.json();
  const res = NextResponse.json({ ok: true });
  if (token) {
    res.cookies.set("token", token, { httpOnly: false, sameSite: "lax", path: "/" });
  }
  if (role) {
    res.cookies.set("role", role, { httpOnly: false, sameSite: "lax", path: "/" });
  }
  return res;
}

// DELETE: امسح الجلسة (المهم لزر Logout)
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  res.cookies.set("role", "", { path: "/", maxAge: 0 });
  return res;
}
