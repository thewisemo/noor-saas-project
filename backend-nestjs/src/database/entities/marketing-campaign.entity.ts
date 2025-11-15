import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

export enum MarketingChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

@Entity({ name: 'marketing_campaigns' })
@Index('IDX_marketing_campaign_tenant', ['tenant_id'])
export class MarketingCampaign extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: MarketingChannel })
  channel: MarketingChannel;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  audience?: Record<string, any> | null;

  @Column({ type: 'varchar', length: 30, default: 'draft' })
  status: string;
}

