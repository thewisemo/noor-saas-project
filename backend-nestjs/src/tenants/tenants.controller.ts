import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TenantsService, CreateTenantDto, UpdateTenantDto, Tenant } from './tenants.service';

/**
 * ملاحظة مهمة:
 * - عاملنا كنترولرين في نفس الملف:
 *   1) TenantsPublicController  للمسارات العامة: /tenants/check
 *   2) TenantsSuperController   لمسارات السوبر:  /super/tenants
 * - بدون حمايات مؤقتاً لتفادي مشاكل الحرس/الدوران، لأننا نحتاج التشغيل الآن.
 *   يمكن إضافة JwtAuthGuard + RolesGuard لاحقاً بسهولة.
 */

/* =======================
   المسارات العامة: /tenants
   ======================= */
@Controller('tenants')
export class TenantsPublicController {
  constructor(private readonly tenants: TenantsService) {}

  // GET /api/tenants/check?slug=foo
  @Get('check')
  checkSlug(@Query('slug') slug?: string): { available: boolean } {
    if (!slug || !slug.trim()) {
      return { available: false };
    }
    return { available: this.tenants.isSlugAvailable(slug) };
    // في الواجهة استخدمنا {available:true/false}
  }
}

/* ==========================
   مسارات السوبر: /super/tenants
   ========================== */
@Controller('super/tenants')
export class TenantsSuperController {
  constructor(private readonly tenants: TenantsService) {}

  // GET /api/super/tenants?name=&slug=&domain=
  @Get()
  list(
    @Query('name') name?: string,
    @Query('slug') slug?: string,
    @Query('domain') domain?: string,
  ): Tenant[] {
    return this.tenants.list(name, slug, domain);
  }

@Controller('tenants')
export class TenantsController {
  // endpoint بسيط للتأكد إن الكنترولر متوصّل كويس
  @Get('health')
  health() {
    return { ok: true };
  }
}

  // POST /api/super/tenants
  // { name, slug?, domain? }
  @Post()
  create(@Body() dto: CreateTenantDto): Tenant {
    return this.tenants.create(dto);
  }

  // POST /api/super/tenants/seed-ghithak  (اختياري: زر جاهز)
  @Post('seed-ghithak')
  seedGhithak(): Tenant {
    return this.tenants.seedGhithak();
  }

  // PATCH /api/super/tenants/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto): Tenant {
    return this.tenants.update(Number(id), dto);
  }

  // DELETE /api/super/tenants/:id
  @Delete(':id')
  remove(@Param('id') id: string): { ok: true } {
    this.tenants.remove(Number(id));
    return { ok: true };
  }
}
