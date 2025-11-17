import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantUsersService } from './tenant-users.service';
import { TenantUsersController } from './tenant-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant])],
  providers: [TenantUsersService],
  controllers: [TenantUsersController],
})
export class TenantUsersModule {}

