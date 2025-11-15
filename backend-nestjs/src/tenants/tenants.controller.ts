import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../database/entities/user.entity';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.tenantsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() body: { name: string; slug?: string; domain?: string | null; whatsappPhoneNumberId?: string | null }) {
    return this.tenantsService.create(body);
  }

  @Get('check')
  async checkSlug(@Query('slug') slug: string) {
    const s = (slug || '').trim().toLowerCase();
    if (!s) return { available: false, reason: 'EMPTY_SLUG' };
    const available = await this.tenantsService.isSlugAvailable(s);
    return { available };
  }
}
