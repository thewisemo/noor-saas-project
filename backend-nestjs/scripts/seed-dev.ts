import * as bcrypt from 'bcrypt';
import dataSource from '../ormconfig';

const {
  ALLOW_DEFAULT_SUPER_ADMIN_SEED,
  SUPER_ADMIN_EMAIL = 'admin@noor.system',
  SUPER_ADMIN_PASSWORD = 'superadmin123',
  SUPER_ADMIN_NAME = 'Noor Super Admin',
  SEED_TENANT_NAME = 'Noor Test Tenant',
  SEED_TENANT_SLUG = 'noor-test',
  SEED_TENANT_DOMAIN = '',
  SEED_TENANT_WHATSAPP_PHONE_ID = '',
  TENANT_ADMIN_EMAIL = 'tenant-admin@noor.test',
  TENANT_ADMIN_PASSWORD = 'TenantAdmin123!',
  TENANT_ADMIN_NAME = 'Noor Tenant Admin',
  SEED_PRODUCT_NAME = 'Test Product',
  SEED_PRODUCT_SKU = 'TEST-SKU',
  SEED_PRODUCT_BARCODE = 'TEST-BARCODE',
  SEED_PRODUCT_PRICE = '25.00',
  SEED_PRODUCT_CURRENCY = 'SAR',
} = process.env;

async function seed() {
  if (ALLOW_DEFAULT_SUPER_ADMIN_SEED !== 'true') {
    console.warn(
      '[seed] ALLOW_DEFAULT_SUPER_ADMIN_SEED is not true. Refusing to seed test users.',
    );
    process.exit(1);
  }

  await dataSource.initialize();

  try {
    const superAdminPasswordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
    await dataSource.query(
      `
      INSERT INTO "users" ("tenant_id", "name", "email", "password_hash", "role", "is_active")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("email") DO UPDATE
      SET "name" = EXCLUDED."name",
          "password_hash" = EXCLUDED."password_hash",
          "role" = EXCLUDED."role",
          "is_active" = EXCLUDED."is_active",
          "tenant_id" = NULL
      `,
      [null, SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, superAdminPasswordHash, 'SUPER_ADMIN', true],
    );

    const [tenantRow] = await dataSource.query(
      `
      INSERT INTO "tenants" ("name", "slug", "domain", "whatsapp_phone_number_id", "settings", "is_active")
      VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), '{}'::jsonb, true)
      ON CONFLICT ("slug") DO UPDATE
      SET "name" = EXCLUDED."name",
          "domain" = EXCLUDED."domain",
          "whatsapp_phone_number_id" = EXCLUDED."whatsapp_phone_number_id",
          "is_active" = EXCLUDED."is_active"
      RETURNING "id"
      `,
      [SEED_TENANT_NAME, SEED_TENANT_SLUG, SEED_TENANT_DOMAIN, SEED_TENANT_WHATSAPP_PHONE_ID],
    );

    const tenantId = tenantRow?.id as string;
    if (!tenantId) {
      throw new Error('[seed] Unable to resolve tenant id for seeded tenant.');
    }

    const tenantAdminPasswordHash = await bcrypt.hash(TENANT_ADMIN_PASSWORD, 12);
    await dataSource.query(
      `
      INSERT INTO "users" ("tenant_id", "name", "email", "password_hash", "role", "is_active")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("email") DO UPDATE
      SET "tenant_id" = EXCLUDED."tenant_id",
          "name" = EXCLUDED."name",
          "password_hash" = EXCLUDED."password_hash",
          "role" = EXCLUDED."role",
          "is_active" = EXCLUDED."is_active"
      `,
      [tenantId, TENANT_ADMIN_NAME, TENANT_ADMIN_EMAIL, tenantAdminPasswordHash, 'TENANT_ADMIN', true],
    );

    await dataSource.query(
      `
      INSERT INTO "products" ("tenant_id", "name", "sku", "barcode", "price", "currency", "is_active", "is_available")
      VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, true, true)
      ON CONFLICT ("tenant_id", "sku") DO UPDATE
      SET "name" = EXCLUDED."name",
          "barcode" = EXCLUDED."barcode",
          "price" = EXCLUDED."price",
          "currency" = EXCLUDED."currency",
          "is_active" = EXCLUDED."is_active",
          "is_available" = EXCLUDED."is_available"
      `,
      [
        tenantId,
        SEED_PRODUCT_NAME,
        SEED_PRODUCT_SKU,
        SEED_PRODUCT_BARCODE,
        SEED_PRODUCT_PRICE,
        SEED_PRODUCT_CURRENCY,
      ],
    );

    console.log('[seed] Seeded super admin, tenant, tenant admin, and test product.');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch(error => {
  console.error('[seed] Failed to seed:', error);
  process.exit(1);
});
