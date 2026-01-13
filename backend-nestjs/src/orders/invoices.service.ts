import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../database/entities/invoice.entity';
import { Order, PaymentStatus } from '../database/entities/order.entity';
import { Payment, PaymentMethod } from '../database/entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async createInvoice(tenantId: string, orderId: string) {
    if (!tenantId) throw new BadRequestException('tenant-context-required');
    const order = await this.orderRepo.findOne({ where: { id: orderId, tenant_id: tenantId } });
    if (!order) throw new NotFoundException('order-not-found');

    const existing = await this.invoiceRepo.findOne({
      where: { tenant_id: tenantId, order_id: orderId },
      relations: ['payments'],
    });
    if (existing) return existing;

    const invoice = this.invoiceRepo.create({
      tenant_id: tenantId,
      order_id: order.id,
      customer_id: order.customer_id,
      status: InvoiceStatus.OPEN,
      total_amount: order.total_amount,
      amount_paid: '0',
    });

    return this.invoiceRepo.save(invoice);
  }

  async getInvoice(tenantId: string, invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, tenant_id: tenantId },
      relations: ['payments', 'order', 'customer'],
    });
    if (!invoice) throw new NotFoundException('invoice-not-found');
    return invoice;
  }

  async recordPayment(tenantId: string, invoiceId: string, dto: CreatePaymentDto) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, tenant_id: tenantId },
    });
    if (!invoice) throw new NotFoundException('invoice-not-found');

    const payment = this.paymentRepo.create({
      tenant_id: tenantId,
      invoice_id: invoice.id,
      order_id: invoice.order_id,
      method: dto.method as PaymentMethod,
      amount: dto.amount.toFixed(2),
      status: PaymentStatus.PAID,
    });

    await this.paymentRepo.save(payment);

    const amountPaid = Number(invoice.amount_paid) + dto.amount;
    const totalAmount = Number(invoice.total_amount);
    invoice.amount_paid = amountPaid.toFixed(2);
    invoice.status = amountPaid >= totalAmount ? InvoiceStatus.PAID : InvoiceStatus.OPEN;
    await this.invoiceRepo.save(invoice);

    await this.orderRepo.update(
      { id: invoice.order_id, tenant_id: tenantId },
      { payment_status: invoice.status === InvoiceStatus.PAID ? PaymentStatus.PAID : PaymentStatus.PENDING },
    );

    return this.getInvoice(tenantId, invoice.id);
  }
}
