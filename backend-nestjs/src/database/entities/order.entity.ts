import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { Branch } from './branch.entity';
import { Zone } from './zone.entity';
import { OrderItem } from './order-item.entity';
import { Tenant } from './tenant.entity';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

@Entity({ name: 'orders' })
@Index('IDX_orders_tenant', ['tenant_id'])
export class Order extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ length: 50 })
  order_number: string;

  @ManyToOne(() => Customer, { nullable: false })
  customer: Customer;

  @Column({ type: 'uuid' })
  customer_id: string;

  @ManyToOne(() => Branch, { nullable: true })
  branch?: Branch | null;

  @Column({ type: 'uuid', nullable: true })
  branch_id: string | null;

  @ManyToOne(() => Zone, { nullable: true })
  zone?: Zone | null;

  @Column({ type: 'uuid', nullable: true })
  zone_id: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.CONFIRMED })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  payment_status: PaymentStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  sub_total: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  delivery_fee: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total_amount: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  promotion_code?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_driver_id?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  placed_via?: string | null;

  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];
}

