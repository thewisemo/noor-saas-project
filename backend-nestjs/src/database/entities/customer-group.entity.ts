import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'customer_groups' })
@Index('IDX_customer_group_tenant', ['tenant_id'])
export class CustomerGroup extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  rules?: Record<string, any> | null;
}

