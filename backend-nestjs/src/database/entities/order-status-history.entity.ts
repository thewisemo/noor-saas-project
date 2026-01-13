import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Order, OrderStatus } from './order.entity';

@Entity({ name: 'order_status_history' })
@Index('IDX_order_status_history_tenant', ['tenant_id'])
@Index('IDX_order_status_history_tenant_order', ['tenant_id', 'order_id'])
export class OrderStatusHistory extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, { nullable: false })
  order: Order;

  @Column({ type: 'enum', enum: OrderStatus, nullable: true })
  previous_status?: OrderStatus | null;

  @Column({ type: 'enum', enum: OrderStatus })
  new_status: OrderStatus;
}
