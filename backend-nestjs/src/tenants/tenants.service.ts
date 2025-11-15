import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type CreateTenantDto = {
  name: string;
  slug?: string;
  domain?: string | null;
};

export type UpdateTenantDto = Partial<CreateTenantDto> & {
  active?: boolean;
};

export type Tenant = {
  id: number;
  name: string;
  slug: string;
  domain?: string | null;
  active: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
};

@Injectable()
export class TenantsService {
  /**
   * مكان تخزين بيانات المستأجرين بشكل مؤقت (JSON على القرص).
   * الهدف: تشغيل لوحة السوبر وعمليات الإضافة/الفحص بدون ما نعطّل المشروع بانتظار ORM.
   */
  private readonly dataDir = path.resolve(process.cwd(), '.data');
  private readonly dataFile = path.resolve(this.dataDir, 'tenants.json');

  // ====== أدوات مساعدة للملف ======
  private ensureStore() {
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    if (!fs.existsSync(this.dataFile)) fs.writeFileSync(this.dataFile, '[]', 'utf8');
  }

  private readAll(): Tenant[] {
    this.ensureStore();
    try {
      const raw = fs.readFileSync(this.dataFile, 'utf8');
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as Tenant[]) : [];
    } catch {
      return [];
    }
  }

  private writeAll(items: Tenant[]) {
    this.ensureStore();
    fs.writeFileSync(this.dataFile, JSON.stringify(items, null, 2), 'utf8');
  }

  private nowISO() {
    return new Date().toISOString();
  }

  private slugify(input: string): string {
    // تبسيط للسلاج: حروف صغيرة + شرطات - بدون مسافات/رموز
    return (input || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u0652]/g, '') // تشكيل عربي
      .replace(/[^a-z0-9\u0621-\u064A]+/gi, '-') // أي شيء غير حرف/رقم ➜ -
      .replace(/^-+|-+$/g, '') // قص الشرطات من الأطراف
      .replace(/-+/g, '-'); // شرطة واحدة متتالية
  }

  // ====== واجهة الخدمة ======
  list(name?: string, slug?: string, domain?: string): Tenant[] {
    const items = this.readAll();
    return items
      .filter((t) =>
        (name ? t.name.toLowerCase().includes(name.toLowerCase()) : true) &&
        (slug ? t.slug.toLowerCase().includes(slug.toLowerCase()) : true) &&
        (domain ? (t.domain || '').toLowerCase().includes(domain.toLowerCase()) : true),
      )
      .sort((a, b) => a.id - b.id);
  }

  getById(id: number): Tenant | undefined {
    return this.readAll().find((t) => t.id === id);
  }

  getBySlug(slug: string): Tenant | undefined {
    return this.readAll().find((t) => t.slug.toLowerCase() === slug.toLowerCase());
  }

  isSlugAvailable(slug: string): boolean {
    const s = this.slugify(slug);
    return !this.readAll().some((t) => t.slug.toLowerCase() === s.toLowerCase());
  }

  create(dto: CreateTenantDto): Tenant {
    const items = this.readAll();

    // تجهيز القيم
    const name = (dto.name || '').trim();
    if (!name) {
      throw new Error('Tenant name is required');
    }

    const slug = this.slugify(dto.slug || name);
    if (!slug) {
      throw new Error('Tenant slug is required');
    }

    // فحص تفرّد السلاج
    if (!this.isSlugAvailable(slug)) {
      throw new Error('Slug already exists');
    }

    const now = this.nowISO();
    const newTenant: Tenant = {
      id: items.length ? Math.max(...items.map((t) => t.id)) + 1 : 1,
      name,
      slug,
      domain: dto.domain?.trim() || null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    items.push(newTenant);
    this.writeAll(items);

    return newTenant;
  }

  update(id: number, dto: UpdateTenantDto): Tenant {
    const items = this.readAll();
    const idx = items.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Tenant not found');

    // تحديث الحقول
    if (typeof dto.name === 'string') items[idx].name = dto.name.trim();
    if (typeof dto.domain === 'string') items[idx].domain = dto.domain.trim();
    if (typeof dto.active === 'boolean') items[idx].active = dto.active;

    if (typeof dto.slug === 'string' && dto.slug.trim()) {
      const newSlug = this.slugify(dto.slug);
      if (
        newSlug &&
        newSlug !== items[idx].slug &&
        !items.some((t) => t.id !== id && t.slug.toLowerCase() === newSlug.toLowerCase())
      ) {
        items[idx].slug = newSlug;
      } else {
        throw new Error('Slug already exists or invalid');
      }
    }

    items[idx].updatedAt = this.nowISO();
    this.writeAll(items);
    return items[idx];
  }

  remove(id: number): void {
    const items = this.readAll();
    const next = items.filter((t) => t.id !== id);
    this.writeAll(next);
  }

  /** زرّ “+ GHITHAK” — يضيف غِذائك بسرعة إن لم يكن موجوداً */
  seedGhithak(): Tenant {
    const exists = this.getBySlug('ghithak');
    if (exists) return exists;
    return this.create({ name: 'GHITHAK', slug: 'ghithak' });
  }
}
