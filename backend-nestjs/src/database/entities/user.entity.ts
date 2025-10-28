import { Entity, Column } from 'typeorm';
import { BaseEntityWithTenant } from './base.entity';
export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'STAFF' | 'DRIVER' | 'PREPARER';
@Entity({ name: 'users' })
export class User extends BaseEntityWithTenant {
  @Column({ nullable: true }) name: string;
  @Column({ nullable: true, unique: true }) email: string;
  @Column({ nullable: true, unique: true }) phone: string;
  @Column() password_hash: string;
  @Column({ type: 'varchar', length: 20, default: 'STAFF' }) role: UserRole;
  @Column({ default: true }) is_active: boolean;
}
