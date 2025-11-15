import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Customer } from './customer.entity';
import { User } from './user.entity';

export enum ConversationStatus {
  AI_ACTIVE = 'AI_ACTIVE',
  AGENT_TAKEN_OVER = 'AGENT_TAKEN_OVER',
  RESOLVED = 'RESOLVED',
}

@Entity({ name: 'conversations' })
@Index('IDX_conversation_tenant', ['tenant_id'])
export class Conversation extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  customer_id: string;

  @ManyToOne(() => Customer, { nullable: false })
  customer: Customer;

  @Column({ type: 'varchar', length: 20, default: 'WHATSAPP' })
  channel: string;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.AI_ACTIVE })
  status: ConversationStatus;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  messages: Array<{
    id: string;
    from: 'customer' | 'agent' | 'bot';
    content: string;
    created_at: string;
    metadata?: Record<string, any>;
  }>;

  @Column({ type: 'uuid', nullable: true })
  assigned_agent_id?: string | null;

  @ManyToOne(() => User, { nullable: true })
  assigned_agent?: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_message_at?: Date | null;
}

