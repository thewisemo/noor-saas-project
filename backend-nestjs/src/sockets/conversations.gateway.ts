import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/src/constants/socket-events';
import { SocketAuthService } from './socket-auth.service';
import { ValidationPipe } from '@nestjs/common';
import { IsEnum, IsString } from 'class-validator';
import { ConversationStatus } from '../database/entities/conversation.entity';

class ConversationAckDto {
  @IsString()
  conversationId!: string;

  @IsEnum(ConversationStatus)
  status!: ConversationStatus;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/service' })
export class ConversationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly validationPipe = new ValidationPipe({ transform: true, whitelist: true });

  constructor(private readonly socketAuth: SocketAuthService) {}

  async handleConnection(client: Socket) {
    try {
      await this.socketAuth.authenticate(client);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    client.disconnect();
  }

  @SubscribeMessage('service:ack')
  async handleAgentAck(@ConnectedSocket() client: Socket, @MessageBody() body: ConversationAckDto) {
    const dto = (await this.validationPipe.transform(body, {
      type: 'body',
      metatype: ConversationAckDto,
    })) as ConversationAckDto;
    const tenantId = client.data?.user?.tenant_id;
    if (!tenantId) return;
    this.server.to(this.socketAuth.getTenantRoom(tenantId)).emit(SOCKET_EVENTS.CONVERSATION_UPDATE, {
      conversationId: dto.conversationId,
      status: dto.status,
      agentId: client.data.user?.sub,
      acknowledgedAt: new Date().toISOString(),
    });
  }

  emitConversationUpdate(tenantId: string, payload: any) {
    this.server.to(this.socketAuth.getTenantRoom(tenantId)).emit(SOCKET_EVENTS.CONVERSATION_UPDATE, payload);
  }
}

