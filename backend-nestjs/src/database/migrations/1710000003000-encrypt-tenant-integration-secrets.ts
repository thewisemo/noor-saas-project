import { MigrationInterface, QueryRunner } from 'typeorm';
import crypto from 'crypto';

const ENCRYPTION_PREFIX = 'enc:v1';

export class EncryptTenantIntegrationSecrets1710000003000 implements MigrationInterface {
  name = 'EncryptTenantIntegrationSecrets1710000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const key = this.getKey();
    const rows = await queryRunner.query(
      'SELECT id, whatsapp_access_token, ai_api_key FROM tenant_integrations',
    );

    for (const row of rows) {
      const currentWhatsapp = row.whatsapp_access_token as string | null;
      const currentAiKey = row.ai_api_key as string | null;
      const whatsappAccessToken = this.encryptIfNeeded(currentWhatsapp, key);
      const aiApiKey = this.encryptIfNeeded(currentAiKey, key);

      if (whatsappAccessToken !== currentWhatsapp || aiApiKey !== currentAiKey) {
        await queryRunner.query(
          'UPDATE tenant_integrations SET whatsapp_access_token = $1, ai_api_key = $2 WHERE id = $3',
          [whatsappAccessToken, aiApiKey, row.id],
        );
      }
    }
  }

  public async down(): Promise<void> {
    return;
  }

  private encryptIfNeeded(value: string | null, key: Buffer): string | null {
    if (!value) return value;
    if (value.startsWith(`${ENCRYPTION_PREFIX}:`)) return value;
    return this.encrypt(value, key);
  }

  private encrypt(value: string, key: Buffer): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      ENCRYPTION_PREFIX,
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  private getKey(): Buffer {
    const rawKey = process.env.NOOR_MASTER_KEY;
    if (!rawKey) {
      throw new Error('NOOR_MASTER_KEY is required for encrypting tenant integration secrets');
    }
    const trimmed = rawKey.trim();
    if (trimmed.startsWith('base64:')) {
      return Buffer.from(trimmed.slice(7), 'base64');
    }
    if (trimmed.startsWith('hex:')) {
      return Buffer.from(trimmed.slice(4), 'hex');
    }
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }
    const decoded = Buffer.from(trimmed, 'base64');
    if (decoded.length === 32) {
      return decoded;
    }
    throw new Error('NOOR_MASTER_KEY must be base64 or hex encoded 32-byte value');
  }
}
