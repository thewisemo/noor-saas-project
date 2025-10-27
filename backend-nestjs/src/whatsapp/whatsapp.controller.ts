import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('api/webhook/whatsapp')
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  // للتحقق من التفعيل (Meta Verify)
  @Get()
  verify(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return 'forbidden';
  }

  @Post()
  async handle(@Body() body: any) {
    // مُعالج مبدئي للتجارب – سيُستبدل بمنطق التحليل الكامل
    console.log('Incoming WhatsApp webhook:', JSON.stringify(body));
    return { received: true };
  }
}
