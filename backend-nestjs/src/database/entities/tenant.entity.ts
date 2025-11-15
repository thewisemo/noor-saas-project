import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'tenants' })
export class Tenant extends BaseEntity {
  @Column({ unique: true, length: 150 })
  name: string;

  @Index('UQ_tenant_slug', { unique: true })
  @Column({ unique: true, length: 120 })
  slug: string;

  @Index('UQ_tenant_domain', { unique: true, where: '"domain" IS NOT NULL' })
  @Column({ type: 'varchar', unique: true, nullable: true, length: 190 })
  domain: string | null;

  @Index('UQ_tenant_whatsapp_phone', { unique: true, where: '"whatsapp_phone_number_id" IS NOT NULL' })
  @Column({ type: 'varchar', name: 'whatsapp_phone_number_id', length: 64, nullable: true })
  whatsappPhoneNumberId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any> | null;

  @Column({ default: true })
  is_active: boolean;
}
