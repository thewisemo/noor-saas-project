import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { TenantIntegrationsModule } from '../tenant-integrations/tenant-integrations.module';

@Module({
  imports: [ConfigModule, TenantIntegrationsModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
