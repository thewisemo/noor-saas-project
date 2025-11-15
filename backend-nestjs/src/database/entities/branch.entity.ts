import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'branches' })
@Index('IDX_branch_tenant', ['tenant_id'])
@Index('UQ_branch_tenant_slug', ['tenant_id', 'slug'], { unique: true })
export class Branch extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 120 })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'jsonb', nullable: true })
  location: { lat: number; lng: number } | null;

  @Column({ type: 'jsonb', nullable: true })
  opening_hours: Record<string, any> | null;

  @Column({ default: true })
  is_active: boolean;
}

