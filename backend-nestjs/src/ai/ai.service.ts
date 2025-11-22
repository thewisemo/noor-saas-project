import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { TenantIntegrationsService } from '../tenant-integrations/tenant-integrations.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly integrations: TenantIntegrationsService) {}

  async classifyMessage(tenantId: string, prompt: string, intents: string[]) {
    const { apiKey, model } = await this.integrations.getAiCredentials(tenantId);
    if (!apiKey) {
      this.logger.warn(`OPENAI_API_KEY not configured for tenant ${tenantId}. Returning fallback intent.`);
      await this.integrations.recordAiStatus(tenantId, 'missing-config', 'OPENAI_API_KEY not configured');
      return { intent: intents[0], reason: 'missing-openai-key' };
    }

    const systemPrompt = `You are an intent classifier for a grocery delivery WhatsApp assistant.
Possible intents: ${intents.join(', ')}.
Return JSON with { "intent": "<intent_from_list>", "product": "<optional product name>", "promotionCode": "<optional code>" }.`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
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
      const parsed = JSON.parse(content);
      await this.integrations.recordAiStatus(tenantId, 'ok', null);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to classify intent', error as Error);
      const message = (error as Error)?.message || 'openai-fallback';
      await this.integrations.recordAiStatus(tenantId, 'error', message);
      return { intent: intents[0], reason: 'openai-fallback' };
    }
  }
}

