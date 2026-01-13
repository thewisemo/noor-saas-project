import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyPointsLedger } from '../database/entities/loyalty-points-ledger.entity';
import { Customer } from '../database/entities/customer.entity';
import { Order } from '../database/entities/order.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { AdjustLoyaltyPointsDto } from './dto/adjust-loyalty-points.dto';

@Injectable()
export class LoyaltyPointsService {
  constructor(
    @InjectRepository(LoyaltyPointsLedger)
    private readonly ledgerRepo: Repository<LoyaltyPointsLedger>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async adjustPoints(tenantId: string, customerId: string, dto: AdjustLoyaltyPointsDto) {
    if (!tenantId) throw new BadRequestException('tenant-context-required');
    const customer = await this.customerRepo.findOne({ where: { id: customerId, tenant_id: tenantId } });
    if (!customer) throw new NotFoundException('customer-not-found');

    if (dto.order_id) {
      const order = await this.orderRepo.findOne({
        where: { id: dto.order_id, tenant_id: tenantId },
      });
      if (!order) throw new NotFoundException('order-not-found');
      if (order.customer_id !== customerId) {
        throw new BadRequestException('order-customer-mismatch');
      }
    }

    if (dto.invoice_id) {
      const invoice = await this.invoiceRepo.findOne({
        where: { id: dto.invoice_id, tenant_id: tenantId },
      });
      if (!invoice) throw new NotFoundException('invoice-not-found');
      if (invoice.customer_id !== customerId) {
        throw new BadRequestException('invoice-customer-mismatch');
      }
    }

    const entry = this.ledgerRepo.create({
      tenant_id: tenantId,
      customer_id: customerId,
      order_id: dto.order_id ?? null,
      invoice_id: dto.invoice_id ?? null,
      delta: dto.delta,
      reason: dto.reason,
    });

    return this.ledgerRepo.save(entry);
  }

  async getPoints(tenantId: string, customerId: string) {
    if (!tenantId) throw new BadRequestException('tenant-context-required');
    const customer = await this.customerRepo.findOne({ where: { id: customerId, tenant_id: tenantId } });
    if (!customer) throw new NotFoundException('customer-not-found');

    const totalRow = await this.ledgerRepo
      .createQueryBuilder('ledger')
      .select('COALESCE(SUM(ledger.delta), 0)', 'total')
      .where('ledger.tenant_id = :tenantId', { tenantId })
      .andWhere('ledger.customer_id = :customerId', { customerId })
      .getRawOne<{ total: string }>();

    const entries = await this.ledgerRepo.find({
      where: { tenant_id: tenantId, customer_id: customerId },
      order: { created_at: 'DESC' },
      take: 20,
    });

    return {
      customer_id: customerId,
      total_points: Number(totalRow?.total ?? 0),
      entries,
    };
  }
}
