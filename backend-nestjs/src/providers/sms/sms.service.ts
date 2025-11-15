import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(to: string, message: string) {
    const baseUrl = this.config.get<string>('SMS_PROVIDER_BASE_URL');
    const apiKey = this.config.get<string>('SMS_PROVIDER_API_KEY');
    const senderId = this.config.get<string>('SMS_PROVIDER_SENDER_ID');

    if (!baseUrl || !apiKey) {
      this.logger.warn('SMS provider is not configured. Skipping sendOtp.');
      return;
    }

    try {
      await axios.post(
        `${baseUrl.replace(/\/$/, '')}/messages`,
        {
          to,
          sender: senderId,
          body: message,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 5000,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send OTP SMS', error as Error);
      throw error;
    }
  }
}

