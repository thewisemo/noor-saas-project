import { Body, Controller, Get, Param, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { TenantIntegrationsService } from './tenant-integrations.service';
import { UpdateTenantIntegrationDto } from './dto/update-tenant-integration.dto';
import { TestIntegrationDto } from './dto/test-integration.dto';

@Controller('super/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TenantIntegrationsController {
  constructor(private readonly integrations: TenantIntegrationsService) {}

  @Get(':tenantId/integrations')
  getIntegration(@Param('tenantId') tenantId: string) {
    return this.integrations.getSuperIntegration(tenantId);
  }

  @Put(':tenantId/integrations')
  updateIntegration(@Param('tenantId') tenantId: string, @Body() body: UpdateTenantIntegrationDto) {
    return this.integrations.updateIntegration(tenantId, body);
  }

  @Post(':tenantId/integrations/test')
  testIntegration(@Param('tenantId') tenantId: string, @Body() body: TestIntegrationDto) {
    return this.integrations.testConnection(tenantId, body.target);
  }
}
