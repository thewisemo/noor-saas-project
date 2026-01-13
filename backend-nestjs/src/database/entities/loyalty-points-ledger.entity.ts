import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Customer } from './customer.entity';
import { Order } from './order.entity';
import { Invoice } from './invoice.entity';

@Entity({ name: 'loyalty_points_ledger' })
@Index('IDX_loyalty_points_tenant', ['tenant_id'])
@Index('IDX_loyalty_points_tenant_customer', ['tenant_id', 'customer_id'])
@Index('IDX_loyalty_points_tenant_order', ['tenant_id', 'order_id'])
@Index('IDX_loyalty_points_tenant_invoice', ['tenant_id', 'invoice_id'])
export class LoyaltyPointsLedger extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  customer_id: string;

  @ManyToOne(() => Customer, { nullable: false })
  customer: Customer;

  @Column({ type: 'uuid', nullable: true })
  order_id?: string | null;

  @ManyToOne(() => Order, { nullable: true })
  order?: Order | null;

  @Column({ type: 'uuid', nullable: true })
  invoice_id?: string | null;

  @ManyToOne(() => Invoice, { nullable: true })
  invoice?: Invoice | null;

  @Column({ type: 'int' })
  delta: number;

  @Column({ type: 'varchar', length: 255 })
  reason: string;
}
