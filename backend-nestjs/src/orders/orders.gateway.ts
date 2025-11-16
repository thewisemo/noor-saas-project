import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../shared/constants/socket-events';
import { SocketAuthService } from '../sockets/socket-auth.service';
import { IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '../database/entities/order.entity';
import { ValidationPipe } from '@nestjs/common';

class UpdateOrderStatusDto {
  @IsString()
  orderId!: string;

  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly validationPipe = new ValidationPipe({ transform: true, whitelist: true });

  constructor(private readonly socketAuth: SocketAuthService) {}

  @WebSocketServer() server: Server;

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

  @SubscribeMessage('orders:ping')
  ping(@MessageBody() payload: string) {
    return `pong:${payload}`;
  }

  @SubscribeMessage('orders:update-status')
  async handleStatusUpdate(@ConnectedSocket() client: Socket, @MessageBody() body: UpdateOrderStatusDto) {
    const dto = (await this.validationPipe.transform(body, {
      type: 'body',
      metatype: UpdateOrderStatusDto,
    })) as UpdateOrderStatusDto;
    const tenantId = client.data?.user?.tenant_id;
    if (!tenantId) return;
    this.server.to(this.socketAuth.getTenantRoom(tenantId)).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGE, {
      ...dto,
      tenantId,
      updatedBy: client.data.user?.sub,
    });
  }

  broadcastNewOrder(tenantId: string, order: any) {
    this.server.to(this.socketAuth.getTenantRoom(tenantId)).emit(SOCKET_EVENTS.NEW_ORDER, order);
  }

  broadcastStatusChange(tenantId: string, payload: UpdateOrderStatusDto) {
    this.server.to(this.socketAuth.getTenantRoom(tenantId)).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGE, payload);
  }
}
