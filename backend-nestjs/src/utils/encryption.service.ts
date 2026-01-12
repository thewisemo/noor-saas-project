import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

const ENCRYPTION_PREFIX = 'enc:v1';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const rawKey = config.get<string>('NOOR_MASTER_KEY');
    if (!rawKey) {
      throw new Error('NOOR_MASTER_KEY is required for encryption');
    }
    this.key = this.parseKey(rawKey);
    if (this.key.length !== 32) {
      throw new Error('NOOR_MASTER_KEY must be 32 bytes for AES-256-GCM');
    }
  }

  encrypt(value: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [ENCRYPTION_PREFIX, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
  }

  decrypt(value: string): string {
    if (!value.startsWith(`${ENCRYPTION_PREFIX}:`)) {
      return value;
    }
    const parts = value.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted payload');
    }
    const [, ivB64, tagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  isEncrypted(value?: string | null): boolean {
    if (!value) return false;
    return value.startsWith(`${ENCRYPTION_PREFIX}:`);
  }

  mask(value?: string | null): string | null {
    if (!value) return null;
    const raw = this.decrypt(value);
    if (!raw) return null;
    const visible = raw.slice(-4);
    return `****${visible}`;
  }

  private parseKey(rawKey: string): Buffer {
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

