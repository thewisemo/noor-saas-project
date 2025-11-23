import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantIntegrations1710000002001 implements MigrationInterface {
  name = 'CreateTenantIntegrations1710000002001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_integrations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid UNIQUE NOT NULL,
        "whatsapp_phone_number_id" varchar(64),
        "whatsapp_access_token" text,
        "ai_api_key" text,
        "ai_model" varchar(120),
        "whatsapp_last_status" varchar(32) NOT NULL DEFAULT 'unknown',
        "whatsapp_last_error" text,
        "whatsapp_checked_at" TIMESTAMPTZ,
        "ai_last_status" varchar(32) NOT NULL DEFAULT 'unknown',
        "ai_last_error" text,
        "ai_checked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tenant_integrations_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_tenant_integration_tenant" ON "tenant_integrations" ("tenant_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "tenant_integrations"');
  }
}

