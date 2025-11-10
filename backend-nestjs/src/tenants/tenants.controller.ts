import { Controller, Get, Query } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('check')
  async checkSlug(@Query('slug') slug: string) {
    const s = (slug || '').trim();
    if (!s) return { available: false, reason: 'EMPTY_SLUG' };

    try {
      const list: any[] = await this.tenantsService.findAll?.();
      const exists = Array.isArray(list)
        ? list.some((t: any) => (t?.slug || '').toLowerCase() === s.toLowerCase())
        : false;
      return { available: !exists };
    } catch (e) {
      return { available: true, note: 'FALLBACK_NO_FINDALL' };
    }
  }
}
