import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Product } from './product.entity';
import { Branch } from './branch.entity';

@Entity({ name: 'inventory' })
@Index('IDX_inventory_tenant', ['tenant_id'])
export class Inventory extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @ManyToOne(() => Product, { nullable: false })
  product: Product;

  @Column({ type: 'uuid' })
  product_id: string;

  @ManyToOne(() => Branch, { nullable: true })
  branch?: Branch | null;

  @Column({ type: 'uuid', nullable: true })
  branch_id: string | null;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  reserved_quantity: number;

  @Column({ default: true })
  is_tracking: boolean;
}

