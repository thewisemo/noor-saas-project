import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'products' })
@Index('IDX_product_tenant', ['tenant_id'])
@Index('UQ_product_tenant_sku', ['tenant_id', 'sku'], { unique: true })
export class Product extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 80 })
  sku: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  barcode: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price: string;

  @Column({ type: 'varchar', length: 3, default: 'SAR' })
  currency: string;

  @Column({ type: 'varchar', nullable: true })
  image_url?: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @Column({ type: 'jsonb', nullable: true })
  attributes?: Record<string, any> | null;
}

