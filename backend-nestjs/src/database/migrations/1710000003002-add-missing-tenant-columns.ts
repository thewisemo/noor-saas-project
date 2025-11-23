import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingTenantColumns1710000003002 implements MigrationInterface {
  name = 'AddMissingTenantColumns1710000003002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTenantId = await queryRunner.hasColumn('users', 'tenant_id');
    if (!hasTenantId) {
      await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "tenant_id" uuid`);
      await queryRunner.query(
        `ALTER TABLE "users" ADD CONSTRAINT "FK_user_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL`,
      );
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_tenant" ON "users" ("tenant_id")`);
    }

    const hasWhatsappPhoneNumberId = await queryRunner.hasColumn('tenant_integrations', 'whatsappPhoneNumberId');
    if (!hasWhatsappPhoneNumberId) {
      await queryRunner.query(
        `ALTER TABLE "tenant_integrations" ADD COLUMN "whatsappPhoneNumberId" character varying(64)`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasWhatsappPhoneNumberId = await queryRunner.hasColumn('tenant_integrations', 'whatsappPhoneNumberId');
    if (hasWhatsappPhoneNumberId) {
      await queryRunner.query(`ALTER TABLE "tenant_integrations" DROP COLUMN "whatsappPhoneNumberId"`);
    }

    const hasTenantId = await queryRunner.hasColumn('users', 'tenant_id');
    if (hasTenantId) {
      await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_user_tenant"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_tenant"`);
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tenant_id"`);
    }
  }
}
