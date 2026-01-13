import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Customer } from './customer.entity';
import { Order } from './order.entity';
import { Payment } from './payment.entity';

export enum InvoiceStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
}

@Entity({ name: 'invoices' })
@Index('IDX_invoices_tenant', ['tenant_id'])
@Index('IDX_invoices_tenant_customer', ['tenant_id', 'customer_id'])
@Index('IDX_invoices_tenant_order', ['tenant_id', 'order_id'])
@Index('UQ_invoices_tenant_order', ['tenant_id', 'order_id'], { unique: true })
export class Invoice extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  customer_id: string;

  @ManyToOne(() => Customer, { nullable: false })
  customer: Customer;

  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, { nullable: false })
  order: Order;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.OPEN })
  status: InvoiceStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_amount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  amount_paid: string;

  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];
}
