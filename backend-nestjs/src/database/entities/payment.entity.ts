import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Invoice } from './invoice.entity';
import { Order } from './order.entity';
import { PaymentStatus } from './order.entity';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
}

@Entity({ name: 'payments' })
@Index('IDX_payments_tenant', ['tenant_id'])
@Index('IDX_payments_tenant_invoice', ['tenant_id', 'invoice_id'])
@Index('IDX_payments_tenant_order', ['tenant_id', 'order_id'])
export class Payment extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  invoice_id: string;

  @ManyToOne(() => Invoice, { nullable: false })
  invoice: Invoice;

  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, { nullable: false })
  order: Order;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PAID })
  status: PaymentStatus;
}
