import { Module } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from '../database/entities/zone.entity';
import { Branch } from '../database/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Zone, Branch])],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}

