import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CoordinateDto {
  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @Type(() => Number)
  @IsNumber()
  lat!: number;
}

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @Type(() => Number)
  @IsNumber()
  deliveryFee!: number;

  @Type(() => Number)
  @IsNumber()
  minimumOrderValue!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoordinateDto)
  polygon!: CoordinateDto[];
}

