import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { TenantIntegrationsService } from './tenant-integrations.service';
import { TestIntegrationDto } from './dto/test-integration.dto';

@Controller('admin/integrations')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles(UserRole.TENANT_ADMIN)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TenantIntegrationsAdminController {
  constructor(private readonly integrations: TenantIntegrationsService) {}

  @Get()
  getStatus(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('tenant-required');
    return this.integrations.getStatusSummary(tenantId);
  }

  @Get('credentials')
  getMaskedCredentials(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('tenant-required');
    return this.integrations.getMaskedIntegration(tenantId);
  }

  @Post('test')
  triggerTest(@Req() req: any, @Body() body: TestIntegrationDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('tenant-required');
    return this.integrations.testConnection(tenantId, body.target);
  }
}
