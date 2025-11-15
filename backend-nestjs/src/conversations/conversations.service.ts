import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationStatus } from '../database/entities/conversation.entity';
import { ConversationsGateway } from '../sockets/conversations.gateway';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation) private readonly repo: Repository<Conversation>,
    private readonly gateway: ConversationsGateway,
  ) {}

  list(tenantId: string, status?: ConversationStatus) {
    if (!tenantId) throw new BadRequestException('tenant-context-required');
    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    return this.repo.find({
      where,
      order: { updated_at: 'DESC' },
      take: 100,
      relations: ['customer'],
    });
  }

  async takeover(tenantId: string, conversationId: string, agentId: string) {
    if (!tenantId) throw new BadRequestException('tenant-context-required');
    const conversation = await this.repo.findOne({ where: { id: conversationId, tenant_id: tenantId } });
    if (!conversation) throw new NotFoundException('conversation-not-found');
    conversation.status = ConversationStatus.AGENT_TAKEN_OVER;
    conversation.assigned_agent_id = agentId;
    const saved = await this.repo.save(conversation);
    this.gateway.emitConversationUpdate(tenantId, {
      conversationId,
      status: saved.status,
      agentId,
    });
    return saved;
  }

  async resolve(tenantId: string, conversationId: string) {
    const conversation = await this.repo.findOne({ where: { id: conversationId, tenant_id: tenantId } });
    if (!conversation) throw new NotFoundException('conversation-not-found');
    conversation.status = ConversationStatus.RESOLVED;
    const saved = await this.repo.save(conversation);
    this.gateway.emitConversationUpdate(tenantId, {
      conversationId,
      status: saved.status,
    });
    return saved;
  }
}

