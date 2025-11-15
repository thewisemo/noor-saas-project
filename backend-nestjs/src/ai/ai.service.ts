import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async classifyMessage(prompt: string, intents: string[]) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. Returning fallback intent.');
      return { intent: intents[0], reason: 'missing-openai-key' };
    }

    const systemPrompt = `You are an intent classifier for a grocery delivery WhatsApp assistant.
Possible intents: ${intents.join(', ')}.
Return JSON with { "intent": "<intent_from_list>", "product": "<optional product name>", "promotionCode": "<optional code>" }.`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('empty-openai-response');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Failed to classify intent', error as Error);
      return { intent: intents[0], reason: 'openai-fallback' };
    }
  }
}

