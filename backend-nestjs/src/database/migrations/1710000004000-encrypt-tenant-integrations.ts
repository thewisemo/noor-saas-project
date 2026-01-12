import { MigrationInterface, QueryRunner } from 'typeorm';
import crypto from 'crypto';

const ENCRYPTION_PREFIX = 'enc:v1';

export class EncryptTenantIntegrations1710000004000 implements MigrationInterface {
  name = 'EncryptTenantIntegrations1710000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const masterKey = process.env.NOOR_MASTER_KEY;
    if (!masterKey) {
      throw new Error('NOOR_MASTER_KEY is required to encrypt tenant integrations');
    }
    const key = this.parseKey(masterKey);

    const rows: Array<{ id: string; whatsapp_access_token?: string | null; ai_api_key?: string | null }> =
      await queryRunner.query(
        `SELECT id, whatsapp_access_token, ai_api_key FROM tenant_integrations`,
      );

    for (const row of rows) {
      const updates: Record<string, string | null> = {};
      if (row.whatsapp_access_token && !row.whatsapp_access_token.startsWith(`${ENCRYPTION_PREFIX}:`)) {
        updates.whatsapp_access_token = this.encrypt(row.whatsapp_access_token, key);
      }
      if (row.ai_api_key && !row.ai_api_key.startsWith(`${ENCRYPTION_PREFIX}:`)) {
        updates.ai_api_key = this.encrypt(row.ai_api_key, key);
      }

      if (Object.keys(updates).length > 0) {
        await queryRunner.query(
          `UPDATE tenant_integrations SET whatsapp_access_token = COALESCE($1, whatsapp_access_token), ai_api_key = COALESCE($2, ai_api_key) WHERE id = $3`,
          [updates.whatsapp_access_token ?? null, updates.ai_api_key ?? null, row.id],
        );
      }
    }
  }

  public async down(): Promise<void> {
    // Non-reversible: encrypted secrets should remain encrypted.
  }

  private encrypt(value: string, key: Buffer): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [ENCRYPTION_PREFIX, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
  }

  private parseKey(rawKey: string): Buffer {
    const trimmed = rawKey.trim();
    let key: Buffer;
    if (trimmed.startsWith('base64:')) {
      key = Buffer.from(trimmed.slice(7), 'base64');
    } else if (trimmed.startsWith('hex:')) {
      key = Buffer.from(trimmed.slice(4), 'hex');
    } else if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      key = Buffer.from(trimmed, 'hex');
    } else {
      key = Buffer.from(trimmed, 'base64');
    }
    if (key.length !== 32) {
      throw new Error('NOOR_MASTER_KEY must be 32 bytes for AES-256-GCM');
    }
    return key;
  }
}

