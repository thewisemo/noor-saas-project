import { Body, Controller, Get, Param, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { LoyaltyPointsService } from './loyalty-points.service';
import { AdjustLoyaltyPointsDto } from './dto/adjust-loyalty-points.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../database/entities/user.entity';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LoyaltyPointsController {
  constructor(private readonly loyaltyPointsService: LoyaltyPointsService) {}

  @Post(':id/points/adjust')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  adjustPoints(
    @TenantId() tenantId: string,
    @Param('id') customerId: string,
    @Body() dto: AdjustLoyaltyPointsDto,
  ) {
    return this.loyaltyPointsService.adjustPoints(tenantId, customerId, dto);
  }

  @Get(':id/points')
  getPoints(@TenantId() tenantId: string, @Param('id') customerId: string) {
    return this.loyaltyPointsService.getPoints(tenantId, customerId);
  }
}
