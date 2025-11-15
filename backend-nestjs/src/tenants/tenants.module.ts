// /var/www/noor/backend-nestjs/src/tenants/tenants.module.ts
import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsSuperController, TenantsController } from './tenants.controller';

@Module({
  controllers: [
    // مسارات التينانت العامة (مثلاً: /api/tenants/...)
    TenantsController,
    // مسارات السوبر أدمن (مثلاً: /api/super/tenants/...)
    TenantsSuperController,
  ],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
