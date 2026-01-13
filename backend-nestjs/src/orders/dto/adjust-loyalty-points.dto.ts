import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustLoyaltyPointsDto {
  @IsInt()
  delta!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsUUID()
  @IsOptional()
  order_id?: string;

  @IsUUID()
  @IsOptional()
  invoice_id?: string;
}
