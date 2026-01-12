import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { TenantIntegration } from '../database/entities/tenant-integration.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { UpdateTenantIntegrationDto } from './dto/update-tenant-integration.dto';
import { EncryptionService } from '../utils/encryption.service';

@Injectable()
export class TenantIntegrationsService {
  private readonly graphVersion = 'v18.0';

  constructor(
    @InjectRepository(TenantIntegration) private readonly repo: Repository<TenantIntegration>,
    @InjectRepository(Tenant) private readonly tenantsRepo: Repository<Tenant>,
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
  ) {}

  async ensureIntegration(tenantId: string, presets?: Partial<UpdateTenantIntegrationDto>) {
    let integration = await this.repo.findOne({ where: { tenant_id: tenantId }, relations: ['tenant'] });
    if (!integration) {
      integration = this.repo.create({
        tenant_id: tenantId,
        whatsappLastStatus: 'unknown',
        aiLastStatus: 'unknown',
      });
    }
    if (presets?.whatsappPhoneNumberId !== undefined) {
      integration.whatsappPhoneNumberId = presets.whatsappPhoneNumberId;
    }
    if (!integration.tenant) {
      const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
      if (!tenant) throw new NotFoundException('tenant-not-found');
      integration.tenant = tenant;
    }
    return this.repo.save(integration);
  }

  async getIntegrationForTenant(tenantId: string) {
    return this.ensureIntegration(tenantId);
  }

  async findByWhatsappPhoneNumberId(phoneNumberId: string) {
    if (!phoneNumberId) return null;
    let integration = await this.repo.findOne({ where: { whatsappPhoneNumberId: phoneNumberId }, relations: ['tenant'] });
    if (integration) return integration;
    const tenant = await this.tenantsRepo.findOne({ where: { whatsappPhoneNumberId: phoneNumberId } });
    if (!tenant) return null;
    integration = await this.ensureIntegration(tenant.id, { whatsappPhoneNumberId: phoneNumberId });
    integration.tenant = tenant;
    return integration;
  }

  async updateIntegration(tenantId: string, input: UpdateTenantIntegrationDto) {
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('tenant-not-found');

    const integration = await this.ensureIntegration(tenantId);
    if (input.whatsappPhoneNumberId !== undefined) {
      integration.whatsappPhoneNumberId = input.whatsappPhoneNumberId;
      tenant.whatsappPhoneNumberId = input.whatsappPhoneNumberId;
      await this.tenantsRepo.save(tenant);
    }
    if (input.whatsappAccessToken !== undefined) {
      integration.whatsappAccessToken = input.whatsappAccessToken
        ? this.encryption.encrypt(input.whatsappAccessToken)
        : null;
    }
    if (input.aiApiKey !== undefined) {
      integration.aiApiKey = input.aiApiKey ? this.encryption.encrypt(input.aiApiKey) : null;
    }
    if (input.aiModel !== undefined) integration.aiModel = input.aiModel;

    const saved = await this.repo.save(integration);
    return this.toSuperResponse(saved);
  }

  async getSuperIntegration(tenantId: string) {
    const integration = await this.getIntegrationForTenant(tenantId);
    return this.toSuperResponse(integration);
  }

  async getStatusSummary(tenantId: string) {
    const integration = await this.getIntegrationForTenant(tenantId);
    return {
      whatsapp: {
        connected: integration.whatsappLastStatus === 'ok',
        lastStatus: integration.whatsappLastStatus,
        lastError: integration.whatsappLastError,
        checkedAt: integration.whatsappCheckedAt,
      },
      ai: {
        connected: integration.aiLastStatus === 'ok',
        lastStatus: integration.aiLastStatus,
        lastError: integration.aiLastError,
        checkedAt: integration.aiCheckedAt,
      },
    };
  }

  async getMaskedIntegration(tenantId: string) {
    const integration = await this.getIntegrationForTenant(tenantId);
    return {
      tenantId: integration.tenant_id,
      whatsappPhoneNumberId: integration.whatsappPhoneNumberId,
      whatsappAccessToken: this.encryption.mask(integration.whatsappAccessToken),
      aiApiKey: this.encryption.mask(integration.aiApiKey),
      aiModel: integration.aiModel,
    };
  }

  async getWhatsappCredentials(tenantId: string) {
    const integration = await this.getIntegrationForTenant(tenantId);
    const token = integration.whatsappAccessToken
      ? this.encryption.decrypt(integration.whatsappAccessToken)
      : this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = integration.whatsappPhoneNumberId || this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    return { integration, token, phoneNumberId };
  }

  async getAiCredentials(tenantId: string) {
    const integration = await this.getIntegrationForTenant(tenantId);
    const apiKey = integration.aiApiKey
      ? this.encryption.decrypt(integration.aiApiKey)
      : this.config.get<string>('OPENAI_API_KEY');
    const model = integration.aiModel || this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    return { integration, apiKey, model };
  }

  async recordWhatsappStatus(tenantId: string, status: string, error?: string | null) {
    const integration = await this.getIntegrationForTenant(tenantId);
    integration.whatsappLastStatus = status;
    integration.whatsappLastError = error ? this.truncate(error) : null;
    integration.whatsappCheckedAt = new Date();
    await this.repo.save(integration);
  }

  async recordAiStatus(tenantId: string, status: string, error?: string | null) {
    const integration = await this.getIntegrationForTenant(tenantId);
    integration.aiLastStatus = status;
    integration.aiLastError = error ? this.truncate(error) : null;
    integration.aiCheckedAt = new Date();
    await this.repo.save(integration);
  }

  async testConnection(tenantId: string, target: 'whatsapp' | 'ai') {
    if (target === 'whatsapp') {
      return this.testWhatsapp(tenantId);
    }
    return this.testAi(tenantId);
  }

  private async testWhatsapp(tenantId: string) {
    const { token, phoneNumberId } = await this.getWhatsappCredentials(tenantId);
    if (!token || !phoneNumberId) {
      await this.recordWhatsappStatus(tenantId, 'missing-config', 'WhatsApp credentials are required');
      return { ok: false, error: 'missing-whatsapp-config' };
    }

    try {
      await axios.get(`https://graph.facebook.com/${this.graphVersion}/${phoneNumberId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      await this.recordWhatsappStatus(tenantId, 'ok', null);
      return { ok: true, status: 'ok' };
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || 'whatsapp-test-failed';
      await this.recordWhatsappStatus(tenantId, 'error', message);
      return { ok: false, error: this.truncate(message) };
    }
  }

  private async testAi(tenantId: string) {
    const { apiKey } = await this.getAiCredentials(tenantId);
    if (!apiKey) {
      await this.recordAiStatus(tenantId, 'missing-config', 'OpenAI API key is required');
      return { ok: false, error: 'missing-ai-config' };
    }

    try {
      await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 5000,
      });
      await this.recordAiStatus(tenantId, 'ok', null);
      return { ok: true, status: 'ok' };
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || 'ai-test-failed';
      await this.recordAiStatus(tenantId, 'error', message);
      return { ok: false, error: this.truncate(message) };
    }
  }

  private toSuperResponse(integration: TenantIntegration) {
    return {
      tenantId: integration.tenant_id,
      whatsappPhoneNumberId: integration.whatsappPhoneNumberId,
      whatsappAccessToken: integration.whatsappAccessToken
        ? this.encryption.decrypt(integration.whatsappAccessToken)
        : null,
      whatsappLastStatus: integration.whatsappLastStatus,
      whatsappLastError: integration.whatsappLastError,
      whatsappCheckedAt: integration.whatsappCheckedAt,
      aiApiKey: integration.aiApiKey ? this.encryption.decrypt(integration.aiApiKey) : null,
      aiModel: integration.aiModel,
      aiLastStatus: integration.aiLastStatus,
      aiLastError: integration.aiLastError,
      aiCheckedAt: integration.aiCheckedAt,
    };
  }

  private truncate(value?: string | null) {
    if (!value) return value || null;
    const str = typeof value === 'string' ? value : String(value);
    return str.slice(0, 500);
  }
}
