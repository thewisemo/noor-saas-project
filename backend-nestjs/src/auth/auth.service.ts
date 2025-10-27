import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async seedSuperAdmin() {
    const email = 'admin@noor.system';
    const exists = await this.users.findOne({ where: { email } });
    if (!exists) {
      const u = this.users.create({
        email,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        password_hash: await bcrypt.hash('superadmin123', 10),
        tenant_id: null,
      });
      await this.users.save(u);
    }
  }

  async validateEmailPassword(email: string, password: string) {
    const user = await this.users.findOne({ where: { email, is_active: true } });
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException();
    return user;
  }

  async loginWithEmail(email: string, password: string) {
    const user = await this.validateEmailPassword(email, password);
    const payload = { sub: user.id, role: user.role, tenant_id: user.tenant_id };
    return { token: this.jwt.sign(payload), user };
  }
}
