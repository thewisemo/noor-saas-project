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

  @Column({ length: 150 })
  name: string;

  @Column({ length: 80 })
  sku: string;

  @Column({ length: 32, nullable: true })
  barcode: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price: string;

  @Column({ length: 3, default: 'SAR' })
  currency: string;

  @Column({ nullable: true })
  image_url?: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true })
  is_available: boolean;

  @Column({ type: 'jsonb', nullable: true })
  attributes?: Record<string, any> | null;
}

