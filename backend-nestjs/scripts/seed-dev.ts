import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../ormconfig';
import { Tenant } from '../src/database/entities/tenant.entity';
import { TenantIntegration } from '../src/database/entities/tenant-integration.entity';
import { Product } from '../src/database/entities/product.entity';
import { User, UserRole } from '../src/database/entities/user.entity';

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('[seed] DATABASE_URL is not set. Ensure .env is loaded.');
  }

  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const integrationRepo = dataSource.getRepository(TenantIntegration);
  const productRepo = dataSource.getRepository(Product);
  const userRepo = dataSource.getRepository(User);

  const slug = process.env.SEED_TENANT_SLUG || 'smoke-tenant';
  const name = process.env.SEED_TENANT_NAME || 'Smoke Tenant';
  const barcode = process.env.SEED_PRODUCT_BARCODE || '0000000000';
  const sku = process.env.SEED_PRODUCT_SKU || 'SMOKE-SKU';
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@noor.system';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';
  const tenantAdminEmail = process.env.SMOKE_TENANT_ADMIN_EMAIL || 'smoke-admin@noor.system';
  const tenantAdminPassword = process.env.SMOKE_TENANT_ADMIN_PASSWORD || 'smokeadmin123';
  const tenantAdminName = process.env.SMOKE_TENANT_ADMIN_NAME || 'Smoke Admin';

  let tenant = await tenantRepo.findOne({ where: { slug } });
  if (!tenant) {
    tenant = tenantRepo.create({
      name,
      slug,
      domain: null,
      whatsappPhoneNumberId: null,
      settings: {},
      is_active: true,
    });
    tenant = await tenantRepo.save(tenant);
  } else if (tenant.name !== name || !tenant.is_active) {
    tenant.name = name;
    tenant.is_active = true;
    tenant = await tenantRepo.save(tenant);
  }

  const existingIntegration = await integrationRepo.findOne({ where: { tenant_id: tenant.id } });
  if (!existingIntegration) {
    await integrationRepo.save(
      integrationRepo.create({
        tenant_id: tenant.id,
        whatsappPhoneNumberId: null,
        whatsappAccessToken: null,
        aiApiKey: null,
        aiModel: null,
        whatsappLastStatus: 'unknown',
        aiLastStatus: 'unknown',
      }),
    );
  }

  const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 12);
  const existingSuperAdmin = await userRepo.findOne({ where: { email: superAdminEmail } });
  if (!existingSuperAdmin) {
    await userRepo.save(
      userRepo.create({
        tenant_id: null,
        name: 'Super Admin',
        email: superAdminEmail,
        phone: null,
        password_hash: superAdminPasswordHash,
        role: UserRole.SUPER_ADMIN,
        is_active: true,
      }),
    );
  } else {
    existingSuperAdmin.tenant_id = null;
    existingSuperAdmin.name = existingSuperAdmin.name || 'Super Admin';
    existingSuperAdmin.password_hash = superAdminPasswordHash;
    existingSuperAdmin.role = UserRole.SUPER_ADMIN;
    existingSuperAdmin.is_active = true;
    await userRepo.save(existingSuperAdmin);
  }

  const tenantAdminPasswordHash = await bcrypt.hash(tenantAdminPassword, 12);
  const existingTenantAdmin = await userRepo.findOne({ where: { email: tenantAdminEmail } });
  if (!existingTenantAdmin) {
    await userRepo.save(
      userRepo.create({
        tenant_id: tenant.id,
        name: tenantAdminName,
        email: tenantAdminEmail,
        phone: null,
        password_hash: tenantAdminPasswordHash,
        role: UserRole.TENANT_ADMIN,
        is_active: true,
      }),
    );
  } else {
    existingTenantAdmin.tenant_id = tenant.id;
    existingTenantAdmin.name = tenantAdminName;
    existingTenantAdmin.password_hash = tenantAdminPasswordHash;
    existingTenantAdmin.role = UserRole.TENANT_ADMIN;
    existingTenantAdmin.is_active = true;
    await userRepo.save(existingTenantAdmin);
  }

  let product = await productRepo.findOne({ where: { tenant_id: tenant.id, barcode } });
  if (!product) {
    product = productRepo.create({
      tenant_id: tenant.id,
      name: 'Smoke Sample Product',
      sku,
      barcode,
      price: '10.00',
      currency: 'SAR',
      image_url: null,
      is_active: true,
      is_available: true,
      attributes: null,
    });
    await productRepo.save(product);
  } else {
    product.name = product.name || 'Smoke Sample Product';
    product.sku = sku;
    product.price = product.price || '10.00';
    product.currency = product.currency || 'SAR';
    product.is_active = true;
    product.is_available = true;
    await productRepo.save(product);
  }

  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log(
    `[seed] ready (tenant=${tenant.slug}, product=${barcode}, superAdmin=${superAdminEmail}, tenantAdmin=${tenantAdminEmail})`,
  );
}

run().catch(error => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', error);
  process.exit(1);
});
