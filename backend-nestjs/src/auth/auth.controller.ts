import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string) {
    return this.auth.loginWithEmail(email, password);
  }

  @Post('otp/request')
  async requestOtp(@Body('phone') phone: string, @Body('tenantSlug') tenantSlug: string) {
    return this.auth.requestOtp(phone, tenantSlug);
  }

  @Post('otp/verify')
  async verifyOtp(
    @Body('phone') phone: string,
    @Body('tenantSlug') tenantSlug: string,
    @Body('code') code: string,
  ) {
    return this.auth.verifyOtp(phone, tenantSlug, code);
  }
}
