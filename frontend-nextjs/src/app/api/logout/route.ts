import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const redirectTo = new URL("/login", origin);

  const res = NextResponse.redirect(redirectTo);

  const names = ["token", "role", "access_token", "Authorization"];
  for (const name of names) {
    // امسح الكوكيز بنفس المسار للجذر
    res.cookies.set(name, "", { path: "/", expires: new Date(0) });
  }

  return res;
}
