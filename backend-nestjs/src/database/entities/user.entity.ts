import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  STAFF = 'STAFF',
  DRIVER = 'DRIVER',
  PREPARER = 'PREPARER',
  AGENT = 'AGENT',
}

@Entity({ name: 'users' })
@Index('IDX_user_tenant', ['tenant_id'])
export class User extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: true })
  tenant?: Tenant | null;

  @Column({ type: 'uuid', nullable: true })
  tenant_id!: string | null;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index('UQ_user_email', { unique: true })
  @Column({ type: 'varchar', length: 190, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  phone!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: true })
  password_hash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role!: UserRole;

  @Column({ type: 'bool', default: true })
  is_active!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at?: Date | null;
}
