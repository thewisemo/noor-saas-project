import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'tenant_integrations' })
@Index('UQ_tenant_integration_tenant', ['tenant_id'], { unique: true })
export class TenantIntegration extends BaseEntity {
  @OneToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @Column({ type: 'uuid', unique: true })
  tenant_id: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  whatsappPhoneNumberId?: string | null;

  @Column({ type: 'text', nullable: true })
  whatsappAccessToken?: string | null;

  @Column({ type: 'text', nullable: true })
  aiApiKey?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  aiModel?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'unknown' })
  whatsappLastStatus!: string;

  @Column({ type: 'text', nullable: true })
  whatsappLastError?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  whatsappCheckedAt?: Date | null;

  @Column({ type: 'varchar', length: 32, default: 'unknown' })
  aiLastStatus!: string;

  @Column({ type: 'text', nullable: true })
  aiLastError?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  aiCheckedAt?: Date | null;
}
