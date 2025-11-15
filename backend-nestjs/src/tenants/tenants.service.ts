import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../database/entities/tenant.entity';
import { slugify } from '../utils/slugify';

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private readonly repo: Repository<Tenant>) {}

  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  async isSlugAvailable(slug: string) {
    const existing = await this.repo.findOne({ where: { slug: slugify(slug) } });
    return !existing;
  }

  async create(input: { name: string; slug?: string; domain?: string | null; whatsappPhoneNumberId?: string | null }) {
    if (!input.name?.trim()) {
      throw new BadRequestException('tenant-name-required');
    }
    const slug = slugify(input.slug || input.name);
    const available = await this.isSlugAvailable(slug);
    if (!available) {
      throw new BadRequestException('slug-taken');
    }
    const tenant = this.repo.create({
      name: input.name.trim(),
      slug,
      domain: input.domain?.trim() || null,
      whatsappPhoneNumberId: input.whatsappPhoneNumberId?.trim() || null,
      settings: {},
    });
    return this.repo.save(tenant);
  }
}
