import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../database/entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private readonly repo: Repository<Product>) {}

  async findAlternatives(tenantId: string, barcode: string) {
    if (!tenantId) throw new BadRequestException('tenant-context-required');
    if (!barcode) throw new BadRequestException('barcode-required');
    const product = await this.repo.findOne({ where: { tenant_id: tenantId, barcode } });
    if (!product) throw new NotFoundException('product-not-found');

    const alternatives = await this.repo
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.id != :id', { id: product.id })
      .andWhere('product.is_active = true AND product.is_available = true')
      .orderBy('ABS(product.price::numeric - :price)', 'ASC')
      .setParameter('price', product.price)
      .take(3)
      .getMany();

    return {
      product,
      alternatives,
    };
  }
}

