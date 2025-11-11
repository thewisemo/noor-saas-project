import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const h = new Headers(req.headers);
  const host  = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  const url = new URL("/login", `${proto}://${host}`);

  const res = NextResponse.redirect(url);
  for (const name of ["token","role","access_token","Authorization"]) {
    res.cookies.set(name, "", { path: "/", expires: new Date(0) });
  }
  return res;
}
