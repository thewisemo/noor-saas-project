import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'customers' })
@Index('IDX_customer_tenant', ['tenant_id'])
export class Customer extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index('UQ_customer_tenant_phone', ['tenant_id', 'phone'], { unique: true })
  @Column({ type: 'varchar', length: 25 })
  phone: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  whatsapp_number: string | null;

  @Column({ type: 'varchar', length: 190, nullable: true })
  email: string | null;

  @Column({ type: 'jsonb', nullable: true })
  address: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  location: { lat: number; lng: number } | null;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[] | null;
}

