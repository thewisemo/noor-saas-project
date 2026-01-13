import { IsEnum, IsISO8601, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../database/entities/order.entity';

export class ListOrdersQueryDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @IsISO8601()
  @IsOptional()
  from?: string;

  @IsISO8601()
  @IsOptional()
  to?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}
