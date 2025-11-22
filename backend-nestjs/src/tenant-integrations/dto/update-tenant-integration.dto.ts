import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trimOrNull = Transform(({ value }) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
});

export class UpdateTenantIntegrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @trimOrNull
  whatsappPhoneNumberId?: string | null;

  @IsOptional()
  @IsString()
  @trimOrNull
  whatsappAccessToken?: string | null;

  @IsOptional()
  @IsString()
  @trimOrNull
  aiApiKey?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @trimOrNull
  aiModel?: string | null;
}
