import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../database/entities/tenant.entity';
import { Customer } from '../database/entities/customer.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { Zone } from '../database/entities/zone.entity';
import { Promotion } from '../database/entities/promotion.entity';
import { Product } from '../database/entities/product.entity';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { SocketModule } from '../sockets/socket.module';

@Module({
  imports: [
    ConfigModule,
    AiModule,
    SocketModule,
    TypeOrmModule.forFeature([Tenant, Customer, Conversation, Zone, Promotion, Product]),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}
