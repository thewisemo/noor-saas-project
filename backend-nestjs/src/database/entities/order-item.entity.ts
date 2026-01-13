import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { Product } from './product.entity';
import { Tenant } from './tenant.entity';

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PICKED = 'PICKED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  REPLACED = 'REPLACED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'order_items' })
@Index('IDX_order_item_tenant', ['tenant_id'])
export class OrderItem extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @ManyToOne(() => Order, order => order.items, { nullable: false })
  order: Order;

  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Product, { nullable: false })
  product: Product;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  product_name?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  product_sku?: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  unit_price: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_price: string;

  @Column({ type: 'enum', enum: OrderItemStatus, default: OrderItemStatus.PENDING })
  status: OrderItemStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}
