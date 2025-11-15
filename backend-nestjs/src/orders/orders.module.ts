import { Module } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { SocketModule } from '../sockets/socket.module';

@Module({
  imports: [SocketModule],
  providers: [OrdersGateway],
  exports: [OrdersGateway],
})
export class OrdersModule {}
