import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../database/entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(Customer) private readonly repo: Repository<Customer>) {}

  async createOrGet(tenantId: string, dto: CreateCustomerDto) {
    if (!tenantId) {
      throw new BadRequestException('tenant-context-required');
    }

    const phone = dto.phone.trim();
    let customer = await this.repo.findOne({ where: { tenant_id: tenantId, phone } });
    if (customer) {
      customer = this.repo.merge(customer, {
        name: dto.name?.trim() || customer.name,
        email: dto.email ?? customer.email,
        whatsapp_number: dto.whatsapp_number ?? customer.whatsapp_number,
        address: dto.address ?? customer.address,
        location: dto.location ?? customer.location,
        tags: dto.tags ?? customer.tags,
      });
      return this.repo.save(customer);
    }

    customer = this.repo.create({
      tenant_id: tenantId,
      name: dto.name.trim(),
      phone,
      whatsapp_number: dto.whatsapp_number ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      location: dto.location ?? null,
      tags: dto.tags ?? null,
    });

    return this.repo.save(customer);
  }
}
