import dataSource from '../ormconfig';
import { Tenant } from '../src/database/entities/tenant.entity';
import { TenantIntegration } from '../src/database/entities/tenant-integration.entity';
import { Product } from '../src/database/entities/product.entity';

async function run() {
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const integrationRepo = dataSource.getRepository(TenantIntegration);
  const productRepo = dataSource.getRepository(Product);

  const slug = process.env.SEED_TENANT_SLUG || 'smoke-tenant';
  const name = process.env.SEED_TENANT_NAME || 'Smoke Tenant';
  const barcode = process.env.SEED_PRODUCT_BARCODE || '0000000000';
  const sku = process.env.SEED_PRODUCT_SKU || 'SMOKE-SKU';

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
  }

  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log(`[seed] ready (tenant=${tenant.slug}, product=${barcode})`);
}

run().catch(error => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', error);
  process.exit(1);
});
