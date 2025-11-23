import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { CreateTenantStaffDto } from './dto/create-tenant-staff.dto';

@Injectable()
export class TenantUsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantsRepo: Repository<Tenant>,
  ) {}

  async listUsersByTenant(tenantId: string) {
    await this.ensureTenantExists(tenantId);
    const users = await this.usersRepo.find({
      where: { tenant_id: tenantId, role: UserRole.TENANT_ADMIN },
      order: { created_at: 'DESC' },
    });
    return users.map(user => this.toSafeUser(user));
  }

  async listUsersForTenantAdmin(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenant-required');
    }
    const users = await this.usersRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
    return users.map(user => this.toSafeUser(user));
  }

  async createTenantAdmin(tenantId: string, dto: CreateTenantUserDto) {
    await this.ensureTenantExists(tenantId);
    return this.createUserForTenant(tenantId, dto, [UserRole.TENANT_ADMIN], UserRole.TENANT_ADMIN);
  }

  async createTenantStaff(tenantId: string, dto: CreateTenantStaffDto) {
    if (!tenantId) {
      throw new BadRequestException('tenant-required');
    }
    return this.createUserForTenant(
      tenantId,
      dto,
      [UserRole.TENANT_ADMIN, UserRole.STAFF, UserRole.AGENT],
      UserRole.STAFF,
    );
  }

  private async createUserForTenant(
    tenantId: string,
    dto: CreateTenantUserDto,
    allowedRoles: UserRole[],
    defaultRole: UserRole,
  ) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new BadRequestException('email-already-exists');
    }

    const role = dto.role && allowedRoles.includes(dto.role) ? dto.role : defaultRole;

    const user = this.usersRepo.create({
      tenant_id: tenantId,
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      role,
      is_active: true,
      password_hash: await bcrypt.hash(dto.password, 10),
    });

    try {
      const saved = await this.usersRepo.save(user);
      return this.toSafeUser(saved);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException('email-already-exists');
      }
      throw error;
    }
  }

  private async ensureTenantExists(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenant-required');
    }
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('tenant-not-found');
    }
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    };
  }
}

