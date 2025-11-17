import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TenantUsersService } from './tenant-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { CreateTenantStaffDto } from './dto/create-tenant-staff.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantUsersController {
  constructor(private readonly service: TenantUsersService) {}

  @Get('tenants/:tenantId/users')
  @Roles(UserRole.SUPER_ADMIN)
  listTenantUsers(@Param('tenantId') tenantId: string) {
    return this.service.listUsersByTenant(tenantId);
  }

  @Post('tenants/:tenantId/users')
  @Roles(UserRole.SUPER_ADMIN)
  createTenantAdmin(@Param('tenantId') tenantId: string, @Body() dto: CreateTenantUserDto) {
    return this.service.createTenantAdmin(tenantId, dto);
  }

  @Get('admin/users')
  @Roles(UserRole.TENANT_ADMIN)
  listStaff(@CurrentUser('tenant_id') tenantId: string | null) {
    return this.service.listUsersForTenantAdmin(tenantId || '');
  }

  @Post('admin/users')
  @Roles(UserRole.TENANT_ADMIN)
  createStaff(@CurrentUser('tenant_id') tenantId: string | null, @Body() dto: CreateTenantStaffDto) {
    return this.service.createTenantStaff(tenantId || '', dto);
  }
}

