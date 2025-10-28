import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
class LoginDto { email: string; password: string; }
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { this.auth.seedSuperAdmin().catch(()=>{}); }
  @Post('login') async login(@Body() dto: LoginDto) { return this.auth.loginWithEmail(dto.email, dto.password); }
}
