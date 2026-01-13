import { Body, Controller, Get, Param, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard, TenantGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':id')
  getInvoice(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.getInvoice(tenantId, id);
  }

  @Post(':id/payments')
  recordPayment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.invoicesService.recordPayment(tenantId, id, dto);
  }
}
