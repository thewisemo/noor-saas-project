import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from '../database/entities/zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { Branch } from '../database/entities/branch.entity';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone) private readonly repo: Repository<Zone>,
    @InjectRepository(Branch) private readonly branchesRepo: Repository<Branch>,
  ) {}

  list(tenantId: string) {
    this.ensureTenantContext(tenantId);
    return this.repo.find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async create(tenantId: string, dto: CreateZoneDto) {
    this.ensureTenantContext(tenantId);
    await this.ensureBranchOwnership(tenantId, dto.branchId);
    const zone = this.repo.create({
      tenant_id: tenantId,
      name: dto.name,
      branch_id: dto.branchId || null,
      delivery_fee: dto.deliveryFee.toFixed(2),
      minimum_order_value: dto.minimumOrderValue.toFixed(2),
      polygon: {
        type: 'Polygon',
        coordinates: [this.toPolygonCoordinates(dto.polygon)],
      },
    });
    return this.repo.save(zone);
  }

  async update(tenantId: string, id: string, dto: UpdateZoneDto) {
    this.ensureTenantContext(tenantId);
    const zone = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!zone) throw new NotFoundException('zone-not-found');
    if (dto.branchId !== undefined) {
      await this.ensureBranchOwnership(tenantId, dto.branchId);
      zone.branch_id = dto.branchId || null;
    }
    if (dto.name) zone.name = dto.name;
    if (dto.deliveryFee !== undefined) zone.delivery_fee = dto.deliveryFee.toFixed(2);
    if (dto.minimumOrderValue !== undefined) zone.minimum_order_value = dto.minimumOrderValue.toFixed(2);
    if (dto.polygon) {
      zone.polygon = {
        type: 'Polygon',
        coordinates: [this.toPolygonCoordinates(dto.polygon)],
      };
    }
    return this.repo.save(zone);
  }

  async remove(tenantId: string, id: string) {
    this.ensureTenantContext(tenantId);
    const zone = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!zone) throw new NotFoundException('zone-not-found');
    await this.repo.remove(zone);
    return { deleted: true };
  }

  private async ensureBranchOwnership(tenantId: string, branchId?: string) {
    if (!branchId) return;
    const branch = await this.branchesRepo.findOne({ where: { id: branchId, tenant_id: tenantId } });
    if (!branch) throw new BadRequestException('invalid-branch');
  }

  private toPolygonCoordinates(points: { lat: number; lng: number }[]) {
    if (!Array.isArray(points) || points.length < 3) {
      throw new BadRequestException('polygon-must-have-three-points');
    }
    const coordinates = points.map(p => [p.lng, p.lat]);
    const [firstLng, firstLat] = coordinates[0];
    const [lastLng, lastLat] = coordinates[coordinates.length - 1];
    if (firstLng !== lastLng || firstLat !== lastLat) {
      coordinates.push([firstLng, firstLat]);
    }
    return coordinates;
  }

  private ensureTenantContext(tenantId?: string) {
    if (!tenantId) {
      throw new BadRequestException('tenant-context-required');
    }
  }
}

