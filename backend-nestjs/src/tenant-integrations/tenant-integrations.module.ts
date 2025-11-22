import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantIntegration } from '../database/entities/tenant-integration.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantIntegrationsController } from './tenant-integrations.controller';
import { TenantIntegrationsAdminController } from './tenant-integrations.admin.controller';
import { TenantIntegrationsService } from './tenant-integrations.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([TenantIntegration, Tenant])],
  providers: [TenantIntegrationsService],
  controllers: [TenantIntegrationsController, TenantIntegrationsAdminController],
  exports: [TenantIntegrationsService],
})
export class TenantIntegrationsModule {}
