import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class CreateSuperAdminSeed1710000001000 implements MigrationInterface {
  name = 'CreateSuperAdminSeed1710000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (process.env.ALLOW_DEFAULT_SUPER_ADMIN_SEED !== 'true') {
      // eslint-disable-next-line no-console
      console.log('[migration] Legacy super admin seed skipped (ALLOW_DEFAULT_SUPER_ADMIN_SEED != true).');
      return;
    }
    const passwordHash = await bcrypt.hash('superadmin123', 12);
    await queryRunner.query(
      `
        INSERT INTO "users" ("tenant_id","name","email","password_hash","role","is_active")
        VALUES (NULL,$1,$2,$3,'SUPER_ADMIN', true)
        ON CONFLICT ("email") DO NOTHING
      `,
      ['Noor Super Admin', 'admin@noor.system', passwordHash],
    );
    // eslint-disable-next-line no-console
    console.log('[migration] Legacy super admin seed applied (admin@noor.system).');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, ['admin@noor.system']);
  }
}
