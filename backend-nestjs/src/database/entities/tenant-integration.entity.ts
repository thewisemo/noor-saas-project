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

  @Column({ name: 'whatsapp_phone_number_id', type: 'varchar', length: 64, nullable: true })
  whatsappPhoneNumberId?: string | null;

  @Column({ name: 'whatsapp_access_token', type: 'text', nullable: true })
  whatsappAccessToken?: string | null;

  @Column({ name: 'ai_api_key', type: 'text', nullable: true })
  aiApiKey?: string | null;

  @Column({ name: 'ai_model', type: 'varchar', length: 120, nullable: true })
  aiModel?: string | null;

  @Column({ name: 'whatsapp_last_status', type: 'varchar', length: 32, default: 'unknown' })
  whatsappLastStatus!: string;

  @Column({ name: 'whatsapp_last_error', type: 'text', nullable: true })
  whatsappLastError?: string | null;

  @Column({ name: 'whatsapp_checked_at', type: 'timestamptz', nullable: true })
  whatsappCheckedAt?: Date | null;

  @Column({ name: 'ai_last_status', type: 'varchar', length: 32, default: 'unknown' })
  aiLastStatus!: string;

  @Column({ name: 'ai_last_error', type: 'text', nullable: true })
  aiLastError?: string | null;

  @Column({ name: 'ai_checked_at', type: 'timestamptz', nullable: true })
  aiCheckedAt?: Date | null;
}
