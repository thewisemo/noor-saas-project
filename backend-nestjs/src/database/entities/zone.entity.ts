import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Branch } from './branch.entity';

@Entity({ name: 'zones' })
@Index('IDX_zone_tenant', ['tenant_id'])
export class Zone extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @ManyToOne(() => Branch, { nullable: true })
  branch?: Branch | null;

  @Column({ type: 'uuid', nullable: true })
  branch_id: string | null;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'jsonb' })
  polygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  delivery_fee: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  minimum_order_value: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}

