import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Tenant = {
  id: string;
  name: string;
  slug?: string;
  domain?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "tenants.json");

async function ensureStore() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
  try { await fs.access(DATA_FILE); }
  catch { await fs.writeFile(DATA_FILE, "[]", "utf8"); }
}

async function readAll(): Promise<Tenant[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeAll(items: Tenant[]) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

const slugify = (s: string) =>
  s.toLowerCase()
   .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .replace(/[^a-z0-9]+/g, "-")
   .replace(/(^-|-$)+/g, "");

export async function GET() {
  console.log("[front-api] GET /super/tenants");
  const items = await readAll();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  let body: any = {};
  try { body = await req.json(); } catch {}
  console.log("[front-api] POST /super/tenants ip=%s body=%j file=%s", ip, body, DATA_FILE);

  const name = (body?.name || "").toString().trim();
  if (!name) {
    console.log("[front-api] 400 name required");
    return NextResponse.json({ message: "name required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const slug = (body?.slug || slugify(name)) || undefined;
  const domain = (body?.domain || "").toString().trim() || undefined;

  const items = await readAll();
  if (items.some(t => (t.slug && slug && t.slug === slug) || t.name === name)) {
    console.log("[front-api] 409 exists");
    return NextResponse.json({ message: "Tenant exists" }, { status: 409 });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const tenant: Tenant = { id, name, slug, domain, isActive: true, createdAt: now, updatedAt: now };
  items.push(tenant);
  await writeAll(items);

  console.log("[front-api] 201 created -> %j", tenant);
  return NextResponse.json(tenant, { status: 201 });
}