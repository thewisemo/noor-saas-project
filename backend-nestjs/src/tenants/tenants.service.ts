import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../database/entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private repo: Repository<Tenant>) {}
  findAll() { return this.repo.find(); }
  create(name: string) {
    const t = this.repo.create({ name, is_active: true, tenant_id: null });
    return this.repo.save(t);
  }
}
