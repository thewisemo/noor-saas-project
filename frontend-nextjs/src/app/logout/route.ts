import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(new URL("/login", origin));

  // امسح أي كوكيز محتملة تخص الجلسة
  for (const name of ["token","role","access_token","Authorization"]) {
    res.cookies.set(name, "", { path: "/", expires: new Date(0) });
  }
  return res;
}