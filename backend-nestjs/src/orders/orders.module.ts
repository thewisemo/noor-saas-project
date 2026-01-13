import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersGateway } from './orders.gateway';
import { SocketModule } from '../sockets/socket.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Customer } from '../database/entities/customer.entity';
import { Product } from '../database/entities/product.entity';
import { OrderStatusHistory } from '../database/entities/order-status-history.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { Payment } from '../database/entities/payment.entity';
import { LoyaltyPointsLedger } from '../database/entities/loyalty-points-ledger.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { LoyaltyPointsService } from './loyalty-points.service';
import { LoyaltyPointsController } from './loyalty-points.controller';

@Module({
  imports: [
    SocketModule,
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Customer,
      Product,
      OrderStatusHistory,
      Invoice,
      Payment,
      LoyaltyPointsLedger,
    ]),
  ],
  controllers: [OrdersController, InvoicesController, LoyaltyPointsController],
  providers: [OrdersGateway, OrdersService, InvoicesService, LoyaltyPointsService],
  exports: [OrdersGateway, OrdersService, InvoicesService, LoyaltyPointsService],
})
export class OrdersModule {}
