import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../database/entities/tenant.entity';
import { slugify } from '../utils/slugify';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private readonly repo: Repository<Tenant>) {}

  async findAll() {
    const tenants = await this.repo.find({ order: { created_at: 'DESC' } });
    return tenants.map(t => this.toResponse(t));
  }

  async isSlugAvailable(slug: string) {
    const existing = await this.repo.findOne({ where: { slug: slugify(slug) } });
    return !existing;
  }

  async create(input: CreateTenantDto) {
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
      is_active: input.isActive ?? true,
    });
    const saved = await this.repo.save(tenant);
    return this.toResponse(saved);
  }

  async update(id: string, input: UpdateTenantDto) {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('tenant-not-found');

    if (input.name?.trim()) {
      tenant.name = input.name.trim();
    }
    if (input.slug?.trim()) {
      const nextSlug = slugify(input.slug);
      if (nextSlug !== tenant.slug) {
        const available = await this.isSlugAvailable(nextSlug);
        if (!available) throw new BadRequestException('slug-taken');
        tenant.slug = nextSlug;
      }
    }
    if (input.domain !== undefined) {
      tenant.domain = input.domain?.trim() || null;
    }
    if (input.whatsappPhoneNumberId !== undefined) {
      tenant.whatsappPhoneNumberId = input.whatsappPhoneNumberId?.trim() || null;
    }
    if (input.isActive !== undefined) {
      tenant.is_active = input.isActive;
    }
    const saved = await this.repo.save(tenant);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('tenant-not-found');
    await this.repo.remove(tenant);
    return { deleted: true };
  }

  private toResponse(tenant: Tenant) {
    const { is_active, ...rest } = tenant;
    return { ...rest, isActive: is_active };
  }
}
