import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying(150) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "domain" character varying(190),
        "whatsapp_phone_number_id" character varying(64),
        "settings" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenant_slug" UNIQUE ("slug"),
        CONSTRAINT "UQ_tenant_domain" UNIQUE ("domain"),
        CONSTRAINT "UQ_tenant_whatsapp_phone" UNIQUE ("whatsapp_phone_number_id")
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('SUPER_ADMIN','TENANT_ADMIN','STAFF','DRIVER','PREPARER','AGENT');
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid,
        "name" character varying(150) NOT NULL,
        "email" character varying(190) NOT NULL,
        "phone" character varying(25),
        "password_hash" character varying(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'STAFF',
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "FK_user_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_tenant" ON "users" ("tenant_id");`);

    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "address" character varying(255),
        "phone" character varying(20),
        "location" jsonb,
        "opening_hours" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_branch_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_branch_tenant" ON "branches" ("tenant_id");`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_branch_tenant_slug" ON "branches" ("tenant_id","slug");`);

    await queryRunner.query(`
      CREATE TABLE "zones" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "branch_id" uuid,
        "name" character varying(150) NOT NULL,
        "polygon" jsonb NOT NULL,
        "delivery_fee" numeric(10,2) NOT NULL DEFAULT 0,
        "minimum_order_value" numeric(10,2) NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_zone_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_zone_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_zone_tenant" ON "zones" ("tenant_id");`);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "sku" character varying(80) NOT NULL,
        "barcode" character varying(32),
        "price" numeric(12,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'SAR',
        "image_url" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_available" boolean NOT NULL DEFAULT true,
        "attributes" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_product_tenant" ON "products" ("tenant_id");`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_tenant_sku" ON "products" ("tenant_id","sku");`);

    await queryRunner.query(`
      CREATE TABLE "inventory" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "branch_id" uuid,
        "quantity" integer NOT NULL DEFAULT 0,
        "reserved_quantity" integer NOT NULL DEFAULT 0,
        "is_tracking" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_inventory_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_inventory_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_inventory_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_tenant" ON "inventory" ("tenant_id");`);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "phone" character varying(25) NOT NULL,
        "whatsapp_number" character varying(25),
        "email" character varying(190),
        "address" jsonb,
        "location" jsonb,
        "tags" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_customer_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_customer_tenant" ON "customers" ("tenant_id");`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_customer_tenant_phone" ON "customers" ("tenant_id","phone");`);

    await queryRunner.query(`
      CREATE TABLE "customer_groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "rules" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_customer_group_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_customer_group_tenant" ON "customer_groups" ("tenant_id");`);

    await queryRunner.query(`
      CREATE TYPE "promotion_discount_type_enum" AS ENUM ('PERCENTAGE','FIXED','DELIVERY');
    `);
    await queryRunner.query(`
      CREATE TABLE "promotions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "code" character varying(50) NOT NULL,
        "title" character varying(150) NOT NULL,
        "description" text,
        "discount_type" "promotion_discount_type_enum" NOT NULL,
        "discount_value" numeric(10,2) NOT NULL,
        "max_discount" numeric(10,2),
        "starts_at" TIMESTAMP WITH TIME ZONE,
        "ends_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean NOT NULL DEFAULT true,
        "conditions" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_promotion_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_promotion_tenant" ON "promotions" ("tenant_id");`);

    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM ('DRAFT','CONFIRMED','PREPARING','DISPATCHED','DELIVERED','CANCELLED');
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM ('PENDING','AUTHORIZED','PAID','REFUNDED','FAILED');
    `);
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "order_number" character varying(50) NOT NULL,
        "customer_id" uuid NOT NULL,
        "branch_id" uuid,
        "zone_id" uuid,
        "status" "order_status_enum" NOT NULL DEFAULT 'CONFIRMED',
        "payment_status" "payment_status_enum" NOT NULL DEFAULT 'PENDING',
        "sub_total" numeric(12,2) NOT NULL DEFAULT 0,
        "delivery_fee" numeric(12,2) NOT NULL DEFAULT 0,
        "total_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "promotion_code" character varying(50),
        "metadata" jsonb,
        "assigned_driver_id" uuid,
        "placed_via" character varying(50),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_orders_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orders_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_zone" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_assigned_driver" FOREIGN KEY ("assigned_driver_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_tenant" ON "orders" ("tenant_id");`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_order_tenant_number" ON "orders" ("tenant_id","order_number");`);

    await queryRunner.query(`
      CREATE TYPE "order_item_status_enum" AS ENUM ('PENDING','PICKED','OUT_OF_STOCK','REPLACED','CANCELLED');
    `);
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" numeric(10,2) NOT NULL,
        "total_price" numeric(12,2) NOT NULL,
        "status" "order_item_status_enum" NOT NULL DEFAULT 'PENDING',
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_item_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_item_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_item_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_order_item_tenant" ON "order_items" ("tenant_id");`);

    await queryRunner.query(`
      CREATE TYPE "marketing_channel_enum" AS ENUM ('SMS','WHATSAPP','EMAIL');
    `);
    await queryRunner.query(`
      CREATE TABLE "marketing_campaigns" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "channel" "marketing_channel_enum" NOT NULL,
        "payload" jsonb NOT NULL,
        "audience" jsonb,
        "status" character varying(30) NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_marketing_campaign_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_marketing_campaign_tenant" ON "marketing_campaigns" ("tenant_id");`);

    await queryRunner.query(`
      CREATE TYPE "conversation_status_enum" AS ENUM ('AI_ACTIVE','AGENT_TAKEN_OVER','RESOLVED');
    `);
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "channel" character varying(20) NOT NULL DEFAULT 'WHATSAPP',
        "status" "conversation_status_enum" NOT NULL DEFAULT 'AI_ACTIVE',
        "messages" jsonb NOT NULL DEFAULT '[]',
        "assigned_agent_id" uuid,
        "last_message_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_conversation_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversation_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversation_assigned_agent" FOREIGN KEY ("assigned_agent_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_conversation_tenant" ON "conversations" ("tenant_id");`);

    await queryRunner.query(`
      CREATE TABLE "otp_codes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid,
        "phone" character varying(25) NOT NULL,
        "code_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "is_verified" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_otp_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_otp_tenant_phone" ON "otp_codes" ("tenant_id","phone");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otp_tenant_phone";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_codes";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversation_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conversation_status_enum";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_marketing_campaign_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_campaigns";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "marketing_channel_enum";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_item_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_item_status_enum";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_order_tenant_number";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status_enum";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promotion_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promotions";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "promotion_discount_type_enum";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_group_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_groups";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_customer_tenant_phone";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_product_tenant_sku";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_zone_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "zones";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_branch_tenant_slug";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_branch_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "branches";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants";`);
  }
}

