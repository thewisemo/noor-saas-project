import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/src/constants/socket-events';

@WebSocketGateway({ cors: { origin: '*' } })
export class LocationGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE)
  handleLocation(@MessageBody() payload: { driverId: string; lat: number; lng: number; orderId?: string }) {
    // بثّ الموقع كما هو لجميع المشتركين (يمكن لاحقًا تخصيص نطاق البث على مستوى المستأجر)
    this.server.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, payload);
  }
}
