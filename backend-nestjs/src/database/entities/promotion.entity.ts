import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

export enum PromotionDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  DELIVERY = 'DELIVERY',
}

@Entity({ name: 'promotions' })
@Index('IDX_promotion_tenant', ['tenant_id'])
export class Promotion extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: PromotionDiscountType })
  discount_type: PromotionDiscountType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  discount_value: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  max_discount?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  starts_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  ends_at?: Date | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  conditions?: Record<string, any> | null;
}

