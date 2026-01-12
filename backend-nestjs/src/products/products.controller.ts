import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get('alternatives/:barcode')
  findAlternatives(@TenantId() tenantId: string, @Param('barcode') barcode: string) {
    return this.service.findAlternatives(tenantId, barcode);
  }
}
