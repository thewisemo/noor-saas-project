import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { OtpCode } from '../database/entities/otp-code.entity';
import { SmsService } from '../providers/sms/sms.service';

@Injectable()
export class OtpService {
  private readonly otpLength: number;
  private readonly otpExpiryMinutes: number;
  private readonly maxAttempts: number;

  constructor(
    @InjectRepository(OtpCode) private readonly repo: Repository<OtpCode>,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
  ) {
    this.otpLength = Number(this.config.get('OTP_LENGTH', 6));
    this.otpExpiryMinutes = Number(this.config.get('OTP_EXPIRY_MINUTES', 5));
    this.maxAttempts = Number(this.config.get('OTP_MAX_ATTEMPTS', 3));
  }

  async requestOtp(phone: string, tenantId: string | null) {
    if (!phone) {
      throw new BadRequestException('phone-required');
    }
    const code = this.generateNumericCode(this.otpLength);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.otpExpiryMinutes * 60 * 1000);
    const codeHash = await bcrypt.hash(code, 10);

    const existing = await this.repo.findOne({
      where: { phone, tenant_id: tenantId ?? IsNull() },
    });
    if (existing) {
      existing.code_hash = codeHash;
      existing.expires_at = expiresAt;
      existing.attempts = 0;
      existing.is_verified = false;
      await this.repo.save(existing);
    } else {
      await this.repo.save(
        this.repo.create({
          phone,
          tenant_id: tenantId,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
        }),
      );
    }

    await this.sms.sendOtp(phone, `رمز التحقق من Noor هو ${code}. صالح لمدة ${this.otpExpiryMinutes} دقائق.`);

    return { expiresAt };
  }

  async verifyOtp(phone: string, code: string, tenantId: string | null) {
    if (!phone || !code) {
      throw new BadRequestException('phone-and-code-required');
    }

    const record = await this.repo.findOne({
      where: { phone, tenant_id: tenantId ?? IsNull() },
    });
    if (!record) {
      throw new UnauthorizedException('otp-not-found');
    }

    if (record.is_verified) {
      return true;
    }

    if (record.attempts >= this.maxAttempts) {
      throw new UnauthorizedException('otp-max-attempts');
    }

    if (record.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('otp-expired');
    }

    const ok = await bcrypt.compare(code, record.code_hash);
    record.attempts += 1;

    if (!ok) {
      await this.repo.save(record);
      throw new UnauthorizedException('otp-invalid');
    }

    record.is_verified = true;
    await this.repo.save(record);
    return true;
  }

  private generateNumericCode(length: number) {
    let code = '';
    while (code.length < length) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code.slice(0, length);
  }
}

