import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Customer } from '../database/entities/customer.entity';
import { Product } from '../database/entities/product.entity';
import { OrderStatusHistory } from '../database/entities/order-status-history.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(OrderStatusHistory) private readonly statusHistoryRepo: Repository<OrderStatusHistory>,
  ) {}

  private readonly statusTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.NEW]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELED],
    [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELED],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELED]: [],
  };

  async create(tenantId: string, dto: CreateOrderDto) {
    if (!tenantId) throw new BadRequestException('tenant-context-required');
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('order-items-required');

    return this.orderRepo.manager.transaction(async manager => {
      const customerRepository = manager.getRepository(Customer);
      const orderRepository = manager.getRepository(Order);
      const orderItemRepository = manager.getRepository(OrderItem);
      const productRepository = manager.getRepository(Product);
      const statusHistoryRepository = manager.getRepository(OrderStatusHistory);

      let customer: Customer | null = null;
      if (dto.customer_id) {
        customer = await customerRepository.findOne({
          where: { id: dto.customer_id, tenant_id: tenantId },
        });
        if (!customer) throw new NotFoundException('customer-not-found');
      } else if (dto.customer) {
        customer = await customerRepository.findOne({
          where: { tenant_id: tenantId, phone: dto.customer.phone },
        });
        if (!customer) {
          customer = customerRepository.create({
            tenant_id: tenantId,
            name: dto.customer.name,
            phone: dto.customer.phone,
            email: dto.customer.email ?? null,
            whatsapp_number: null,
            address: null,
            location: null,
            tags: null,
          });
          customer = await customerRepository.save(customer);
        }
      }

      if (!customer) throw new BadRequestException('customer-required');

      const productIds = dto.items.map(item => item.product_id);
      const products = await productRepository.find({
        where: { tenant_id: tenantId, id: In(productIds) },
      });
      const productsById = new Map(products.map(product => [product.id, product]));

      for (const item of dto.items) {
        if (!productsById.has(item.product_id)) {
          throw new NotFoundException('product-not-found');
        }
      }

      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const deliveryFee = dto.delivery_fee ?? 0;

      const order = orderRepository.create({
        tenant_id: tenantId,
        customer_id: customer.id,
        order_number: orderNumber,
        status: OrderStatus.NEW,
        payment_status: PaymentStatus.PENDING,
        sub_total: '0',
        delivery_fee: deliveryFee.toFixed(2),
        total_amount: '0',
        promotion_code: null,
        metadata: null,
        assigned_driver_id: null,
        placed_via: null,
      });

      const savedOrder = await orderRepository.save(order);

      let subTotal = 0;
      const orderItems = dto.items.map(item => {
        const product = productsById.get(item.product_id)!;
        const unitPrice = Number(product.price);
        const totalPrice = unitPrice * item.quantity;
        subTotal += totalPrice;
        return orderItemRepository.create({
          tenant_id: tenantId,
          order_id: savedOrder.id,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: item.quantity,
          unit_price: unitPrice.toFixed(2),
          total_price: totalPrice.toFixed(2),
          metadata: null,
        });
      });

      await orderItemRepository.save(orderItems);

      const totalAmount = subTotal + deliveryFee;
      savedOrder.sub_total = subTotal.toFixed(2);
      savedOrder.delivery_fee = deliveryFee.toFixed(2);
      savedOrder.total_amount = totalAmount.toFixed(2);
      await orderRepository.save(savedOrder);

      await statusHistoryRepository.save(
        statusHistoryRepository.create({
          tenant_id: tenantId,
          order_id: savedOrder.id,
          previous_status: null,
          new_status: savedOrder.status,
        }),
      );

      const createdOrder = await orderRepository.findOne({
        where: { id: savedOrder.id, tenant_id: tenantId },
        relations: ['items', 'customer'],
      });

      return createdOrder;
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.orderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['items', 'customer'],
    });
    if (!order) throw new NotFoundException('order-not-found');
    return order;
  }

  async list(tenantId: string, query: ListOrdersQueryDto) {
    if (!tenantId) throw new BadRequestException('tenant-context-required');
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.tenant_id = :tenantId', { tenantId })
      .orderBy('order.created_at', 'DESC');

    if (query.status) qb.andWhere('order.status = :status', { status: query.status });
    if (query.customer_id) qb.andWhere('order.customer_id = :customerId', { customerId: query.customer_id });
    if (query.from) qb.andWhere('order.created_at >= :from', { from: new Date(query.from) });
    if (query.to) qb.andWhere('order.created_at <= :to', { to: new Date(query.to) });

    const limit = Math.min(query.limit ?? 50, 200);
    qb.take(limit);

    return qb.getMany();
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!order) throw new NotFoundException('order-not-found');

    const allowed = this.statusTransitions[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException('invalid-status-transition');
    }

    const previousStatus = order.status;
    order.status = dto.status;
    await this.orderRepo.save(order);

    await this.statusHistoryRepo.save(
      this.statusHistoryRepo.create({
        tenant_id: tenantId,
        order_id: order.id,
        previous_status: previousStatus,
        new_status: order.status,
      }),
    );

    return order;
  }
}
