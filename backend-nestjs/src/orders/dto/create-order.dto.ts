import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsUUID,
} from 'class-validator';

class CreateOrderCustomerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  email?: string;
}

class CreateOrderItemDto {
  @IsUUID()
  product_id!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @ValidateNested()
  @Type(() => CreateOrderCustomerDto)
  @IsOptional()
  customer?: CreateOrderCustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_fee?: number;
}
