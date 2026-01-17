import { HealthController } from './health.controller';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { SocketModule } from './sockets/socket.module';
import { TrackingModule } from './tracking/tracking.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AiModule } from './ai/ai.module';
import { ZonesModule } from './zones/zones.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ProductsModule } from './products/products.module';
import { TenantUsersModule } from './tenant-users/tenant-users.module';
import { envValidationSchema } from './config/env.validation';
import { TenantIntegrationsModule } from './tenant-integrations/tenant-integrations.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: cfg.get<string>('TYPEORM_SYNC') === 'true',
      }),
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
    ZonesModule,
    ConversationsModule,
    ProductsModule,
    TenantUsersModule,
    TenantIntegrationsModule,
    CustomersModule,
  ],
  controllers: [HealthController],
  providers: [AppService],
})
export class AppModule {}
