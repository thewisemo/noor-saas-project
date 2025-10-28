import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/src/constants/socket-events';
@WebSocketGateway({ cors: { origin: '*' } })
export class OrdersGateway {
  @WebSocketServer() server: Server;
  @SubscribeMessage('ping') ping(@MessageBody() d: string) { return 'pong:' + d; }
  broadcastNewOrder(order: any) { this.server.emit(SOCKET_EVENTS.NEW_ORDER, order); }
}
