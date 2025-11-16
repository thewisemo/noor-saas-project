import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@shared/constants/socket-events';
import { SocketAuthService } from './socket-auth.service';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';
import { Type } from 'class-transformer';

class DriverLocationDto {
  @IsString()
  driverId!: string;

  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsString()
  tenantId!: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/location' })
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
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

  @SubscribeMessage(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE)
  async handleLocation(@ConnectedSocket() client: Socket, @MessageBody() payload: DriverLocationDto) {
    const dto = (await this.validationPipe.transform(payload, {
      type: 'body',
      metatype: DriverLocationDto,
    })) as DriverLocationDto;
    const tenantId = client.data?.user?.tenant_id;
    if (!tenantId || dto.tenantId !== tenantId) {
      return;
    }
    this.server.to(this.socketAuth.getTenantRoom(tenantId)).emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
      ...dto,
      reportedAt: new Date().toISOString(),
    });
  }
}
