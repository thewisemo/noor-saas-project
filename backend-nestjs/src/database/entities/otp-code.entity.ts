import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'otp_codes' })
@Index('IDX_otp_tenant_phone', ['tenant_id', 'phone'], { unique: true })
export class OtpCode extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  tenant_id: string | null;

  @ManyToOne(() => Tenant, { nullable: true })
  tenant?: Tenant | null;

  @Column({ type: 'varchar', length: 25 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  code_hash: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;
}

