import { Entity, Column } from 'typeorm';
import { BaseEntityWithTenant } from './base.entity';

@Entity({ name: 'tenants' })
export class Tenant extends BaseEntityWithTenant {
  @Column({ unique: true })
  name: string;

  @Column({ default: true })
  is_active: boolean;
}
