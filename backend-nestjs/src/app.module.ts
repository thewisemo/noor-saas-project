import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { SocketModule } from './sockets/socket.module';
import { TrackingModule } from './tracking/tracking.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('DATABASE_URL');
        const sync = cfg.get<string>('TYPEORM_SYNC') === 'true';
        return {
          type: 'postgres',
          url,
          autoLoadEntities: true,
          synchronize: sync,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    TenantsModule,
    UsersModule,
    OrdersModule,
    SocketModule,
    TrackingModule,
    WhatsappModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
