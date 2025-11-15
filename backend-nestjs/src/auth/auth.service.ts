import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../database/entities/user.entity';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwt: JwtService,
    private readonly otpService: OtpService,
  ) {}

  async loginWithEmail(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'email', 'password_hash', 'role', 'is_active', 'name', 'tenant_id'],
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('invalid-credentials');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('invalid-credentials');

    return this.buildTokenResponse(user);
  }

  async requestOtp(phone: string, tenantSlug: string) {
    const user = await this.findMobileUser(phone, tenantSlug);
    await this.otpService.requestOtp(user.phone!, user.tenant_id);
    return { ok: true };
  }

  async verifyOtp(phone: string, tenantSlug: string, code: string) {
    const user = await this.findMobileUser(phone, tenantSlug);
    await this.otpService.verifyOtp(user.phone!, code, user.tenant_id);
    return this.buildTokenResponse(user);
  }

  private async findMobileUser(phone: string, tenantSlug: string) {
    if (!phone || !tenantSlug) {
      throw new BadRequestException('phone-and-tenant-required');
    }
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .where('user.phone = :phone', { phone })
      .andWhere('tenant.slug = :slug', { slug: tenantSlug })
      .andWhere('user.role IN (:...roles)', {
        roles: [UserRole.DRIVER, UserRole.PREPARER],
      })
      .getOne();

    if (!user || !user.is_active) {
      throw new UnauthorizedException('mobile-user-not-found');
    }

    return user;
  }

  private async buildTokenResponse(user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'tenant_id'>) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    };
    const token = await this.jwt.signAsync(payload);

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email || '',
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    };
  }
}
