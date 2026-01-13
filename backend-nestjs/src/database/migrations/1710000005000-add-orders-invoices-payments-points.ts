import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrdersInvoicesPaymentsPoints1710000005000 implements MigrationInterface {
  name = 'AddOrdersInvoicesPaymentsPoints1710000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "invoice_status_enum" AS ENUM ('OPEN','PAID','VOID');`);
    await queryRunner.query(`CREATE TYPE "payment_method_enum" AS ENUM ('CASH','CARD');`);

    await queryRunner.query(
      `CREATE TYPE "order_status_enum_new" AS ENUM ('NEW','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELED');`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;`);
    await queryRunner.query(`UPDATE "orders" SET "status" = 'NEW' WHERE "status" = 'DRAFT';`);
    await queryRunner.query(`UPDATE "orders" SET "status" = 'OUT_FOR_DELIVERY' WHERE "status" = 'DISPATCHED';`);
    await queryRunner.query(`UPDATE "orders" SET "status" = 'CANCELED' WHERE "status" = 'CANCELLED';`);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "order_status_enum_new" USING ("status"::text::"order_status_enum_new");`,
    );
    await queryRunner.query(`DROP TYPE "order_status_enum";`);
    await queryRunner.query(`ALTER TYPE "order_status_enum_new" RENAME TO "order_status_enum";`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'NEW';`);

    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "product_name" character varying(150);`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "product_sku" character varying(80);`);

    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "status" "invoice_status_enum" NOT NULL DEFAULT 'OPEN',
        "total_amount" numeric(12,2) NOT NULL,
        "amount_paid" numeric(12,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_invoices_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_tenant" ON "invoices" ("tenant_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_tenant_customer" ON "invoices" ("tenant_id","customer_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_tenant_order" ON "invoices" ("tenant_id","order_id");`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_invoices_tenant_order" ON "invoices" ("tenant_id","order_id");`,
    );

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "invoice_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "method" "payment_method_enum" NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "status" "payment_status_enum" NOT NULL DEFAULT 'PAID',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_payments_tenant" ON "payments" ("tenant_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_tenant_invoice" ON "payments" ("tenant_id","invoice_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_tenant_order" ON "payments" ("tenant_id","order_id");`);

    await queryRunner.query(`
      CREATE TABLE "loyalty_points_ledger" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "order_id" uuid,
        "invoice_id" uuid,
        "delta" integer NOT NULL,
        "reason" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_loyalty_points_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_loyalty_points_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_loyalty_points_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_loyalty_points_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_loyalty_points_tenant" ON "loyalty_points_ledger" ("tenant_id");`);
    await queryRunner.query(
      `CREATE INDEX "IDX_loyalty_points_tenant_customer" ON "loyalty_points_ledger" ("tenant_id","customer_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_loyalty_points_tenant_order" ON "loyalty_points_ledger" ("tenant_id","order_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_loyalty_points_tenant_invoice" ON "loyalty_points_ledger" ("tenant_id","invoice_id");`,
    );

    await queryRunner.query(`
      CREATE TABLE "order_status_history" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "previous_status" "order_status_enum",
        "new_status" "order_status_enum" NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_status_history_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_status_history_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_order_status_history_tenant" ON "order_status_history" ("tenant_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_status_history_tenant_order" ON "order_status_history" ("tenant_id","order_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_status_history_tenant_order";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_status_history_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_status_history";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_loyalty_points_tenant_invoice";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_loyalty_points_tenant_order";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_loyalty_points_tenant_customer";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_loyalty_points_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loyalty_points_ledger";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_order";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_invoice";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_invoices_tenant_order";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_tenant_order";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_tenant_customer";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_tenant";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices";`);

    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "product_sku";`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "product_name";`);

    await queryRunner.query(
      `CREATE TYPE "order_status_enum_old" AS ENUM ('DRAFT','CONFIRMED','PREPARING','DISPATCHED','DELIVERED','CANCELLED');`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;`);
    await queryRunner.query(`UPDATE "orders" SET "status" = 'DRAFT' WHERE "status" = 'NEW';`);
    await queryRunner.query(`UPDATE "orders" SET "status" = 'DISPATCHED' WHERE "status" = 'OUT_FOR_DELIVERY';`);
    await queryRunner.query(`UPDATE "orders" SET "status" = 'CANCELLED' WHERE "status" = 'CANCELED';`);
    await queryRunner.query(`UPDATE "orders" SET "status" = 'PREPARING' WHERE "status" = 'READY';`);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "order_status_enum_old" USING ("status"::text::"order_status_enum_old");`,
    );
    await queryRunner.query(`DROP TYPE "order_status_enum";`);
    await queryRunner.query(`ALTER TYPE "order_status_enum_old" RENAME TO "order_status_enum";`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';`);

    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status_enum";`);
  }
}
