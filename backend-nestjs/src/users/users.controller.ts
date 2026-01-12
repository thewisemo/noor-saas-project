import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { UsersService } from './users.service';
import { ResetSuperAdminDto } from './dto/reset-super-admin.dto';

@Controller('super/admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post('reset-password')
  resetSuperAdminPassword(@Body() dto: ResetSuperAdminDto) {
    return this.users.resetSuperAdminPassword(dto.email, dto.password);
  }
}
