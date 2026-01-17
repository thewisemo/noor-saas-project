import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class CreateSuperAdminSeed1710000002001 implements MigrationInterface {
  name = 'CreateSuperAdminSeed1710000002001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    if (process.env.ALLOW_DEFAULT_SUPER_ADMIN_SEED !== 'true') {
      return;
    }
    const email = process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@ghithak.com.sa';
    const password = process.env.SUPER_ADMIN_PASSWORD ?? 'Ghithak@2025';
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await queryRunner.query(
      'SELECT id FROM "users" WHERE "email" = $1 AND "role" = $2 LIMIT 1',
      [email, 'SUPER_ADMIN'],
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return;
    }

    await queryRunner.query(
      `
        INSERT INTO "users" ("tenant_id", "name", "email", "password_hash", "role", "is_active")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT ("email") DO NOTHING
      `,
      [null, 'Super Admin', email, passwordHash, 'SUPER_ADMIN', true],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const email = process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@ghithak.com.sa';

    await queryRunner.query('DELETE FROM "users" WHERE "email" = $1 AND "role" = $2', [
      email,
      'SUPER_ADMIN',
    ]);
  }
}
