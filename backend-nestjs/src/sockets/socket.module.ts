import { Module } from '@nestjs/common';
import { LocationGateway } from './location.gateway';
import { AuthModule } from '../auth/auth.module';
import { SocketAuthService } from './socket-auth.service';
import { ConversationsGateway } from './conversations.gateway';

@Module({
  imports: [AuthModule],
  providers: [LocationGateway, ConversationsGateway, SocketAuthService],
  exports: [LocationGateway, ConversationsGateway, SocketAuthService],
})
export class SocketModule {}
