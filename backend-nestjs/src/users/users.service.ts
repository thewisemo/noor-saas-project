import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {}

  async resetSuperAdminPassword(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email, role: UserRole.SUPER_ADMIN } });
    if (!user) {
      throw new NotFoundException('super-admin-not-found');
    }
    user.password_hash = await bcrypt.hash(password, 12);
    user.is_active = true;
    return this.usersRepo.save(user);
  }
}
