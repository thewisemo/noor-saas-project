import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';

@Controller('webhook/whatsapp')
export class WhatsappController {
  private readonly verifyToken: string;

  constructor(private readonly service: WhatsappService, config: ConfigService) {
    this.verifyToken = config.get<string>('WHATSAPP_VERIFY_TOKEN', '');
  }

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return 'forbidden';
  }

  @Post()
  async handle(@Body() body: any) {
    await this.service.handleWebhook(body);
    return { received: true };
  }
}
