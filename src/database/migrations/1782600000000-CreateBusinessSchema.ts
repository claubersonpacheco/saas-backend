import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBusinessSchema1782600000000 implements MigrationInterface {
  name = 'CreateBusinessSchema1782600000000';

  private readonly resources = [
    'categories',
    'products',
    'customers',
    'budgets',
    'freelancers',
    'suppliers',
    'budget-items',
    'budget-statuses',
    'invoices',
    'emails',
    'expenses',
    'entries',
    'budget-totals',
    'budget-filters',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
        ADD COLUMN IF NOT EXISTS "code" character varying(120),
        ADD COLUMN IF NOT EXISTS "public_id" character varying(120),
        ADD COLUMN IF NOT EXISTS "price" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "currency" character varying(10) NOT NULL DEFAULT 'EUR',
        ADD COLUMN IF NOT EXISTS "billing_period" character varying(20) NOT NULL DEFAULT 'monthly',
        ADD COLUMN IF NOT EXISTS "trial_days" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "max_users" integer,
        ADD COLUMN IF NOT EXISTS "max_projects" integer,
        ADD COLUMN IF NOT EXISTS "max_storage_mb" integer,
        ADD COLUMN IF NOT EXISTS "features" jsonb,
        ADD COLUMN IF NOT EXISTS "highlighted" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "is_public" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "tax_percentage" numeric(5,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "UQ_plans_code" ON "plans" ("code") WHERE "code" IS NOT NULL');
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "UQ_plans_public_id" ON "plans" ("public_id") WHERE "public_id" IS NOT NULL');

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_tenant_name" UNIQUE ("tenant_id", "name"),
        CONSTRAINT "FK_categories_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "code" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(80) NOT NULL,
        "document" character varying(120),
        "address" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customers_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "UQ_customers_tenant_email" UNIQUE ("tenant_id", "email"),
        CONSTRAINT "FK_customers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "UQ_customers_tenant_document" ON "customers" ("tenant_id", "document") WHERE "document" IS NOT NULL');

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "code" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "product_type" character varying(120) NOT NULL,
        "price" numeric(15,2) NOT NULL,
        "category_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "FK_products_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "budgets" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "name" character varying(255) NOT NULL,
        "code" character varying(255) NOT NULL,
        "description" text,
        "show_service" boolean NOT NULL DEFAULT true,
        "show_description" boolean NOT NULL DEFAULT true,
        "show_qtd" boolean NOT NULL DEFAULT true,
        "show_price" boolean NOT NULL DEFAULT true,
        "show_tax" boolean NOT NULL DEFAULT true,
        "show_total" boolean NOT NULL DEFAULT true,
        "show_tax_value" boolean NOT NULL DEFAULT true,
        "show_sub_total" boolean NOT NULL DEFAULT true,
        "date" date,
        "expirate" date,
        "total_expirate" integer NOT NULL DEFAULT 0,
        "user_id" integer NOT NULL,
        "customer_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budgets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_budgets_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "FK_budgets_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_budgets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_budgets_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "budget_items" (
        "id" SERIAL NOT NULL,
        "budget_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "description" text,
        "quantity" integer NOT NULL,
        "tax" integer NOT NULL DEFAULT 0,
        "price" numeric(10,2) NOT NULL DEFAULT 0,
        "tax_value" numeric(10,2) NOT NULL DEFAULT 0,
        "subtotal" numeric(10,2) NOT NULL DEFAULT 0,
        "total" numeric(10,2) NOT NULL DEFAULT 0,
        "position" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budget_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_budget_items_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_budget_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "freelancers" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "code" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "birth_date" date,
        "email" character varying(255),
        "phone" character varying(80),
        "role" character varying(120),
        "status" smallint NOT NULL DEFAULT 1,
        "address" character varying(255),
        "city" character varying(120),
        "state" character varying(80),
        "zip" character varying(30),
        "document" character varying(120),
        "account_bank" character varying(120),
        "account_number" character varying(120),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_freelancers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_freelancers_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "FK_freelancers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "code" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "email" character varying(255),
        "phone" character varying(80),
        "service_type" character varying(120),
        "address" character varying(255),
        "city" character varying(120),
        "state" character varying(80),
        "zip" character varying(30),
        "document" character varying(120),
        "account_bank" character varying(120),
        "account_number" character varying(120),
        "client" boolean NOT NULL DEFAULT false,
        "code_client" character varying(120),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suppliers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_suppliers_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "FK_suppliers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "budget_statuses" (
        "id" SERIAL NOT NULL,
        "budget_id" integer NOT NULL,
        "status" smallint NOT NULL DEFAULT 1,
        "comments" text,
        "changed_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budget_statuses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_budget_statuses_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_budget_statuses_user" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" SERIAL NOT NULL,
        "budget_id" integer NOT NULL,
        "customer_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "serie" character varying(120) NOT NULL,
        "numero" character varying(120) NOT NULL,
        "fecha_emision" date NOT NULL,
        "base_imponible" numeric(12,2) NOT NULL,
        "tipo_iva" numeric(5,2) NOT NULL,
        "cuota_iva" numeric(12,2) NOT NULL,
        "importe_total" numeric(12,2) NOT NULL,
        "hash_registro" character varying(255),
        "hash_registro_anterior" character varying(255),
        "estado_aeat" character varying(80) NOT NULL DEFAULT 'pendente',
        "pdf_url" character varying(512),
        "xml_url" character varying(512),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoices_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "emails" (
        "id" SERIAL NOT NULL,
        "budget_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "customer_id" integer NOT NULL,
        "subject" character varying(255) NOT NULL,
        "recipient_email" character varying(255) NOT NULL,
        "additional_emails" character varying(255),
        "message" text,
        "status" boolean NOT NULL DEFAULT false,
        "error_message" character varying(255),
        "file" character varying(512),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emails" PRIMARY KEY ("id"),
        CONSTRAINT "FK_emails_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_emails_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_emails_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "expenses" (
        "id" SERIAL NOT NULL,
        "budget_id" integer NOT NULL,
        "supplier_id" integer,
        "category_id" integer,
        "code" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "amount" numeric(12,2) NOT NULL,
        "date" TIMESTAMP,
        "method" character varying(120),
        "invoice" boolean,
        "invoice_number" character varying(120),
        "filename" character varying(255),
        "file_path" character varying(512),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expenses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_expenses_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_expenses_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_expenses_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "entries" (
        "id" SERIAL NOT NULL,
        "budget_id" integer NOT NULL,
        "category_id" integer,
        "code" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "date" TIMESTAMP,
        "amount" numeric(10,2) NOT NULL,
        "method" character varying(120),
        "description" text,
        "received_by" character varying(120),
        "receipt" boolean,
        "receipt_number" character varying(120),
        "filename" character varying(255),
        "file_path" character varying(512),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_entries_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_entries_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "budget_totals" (
        "id" SERIAL NOT NULL,
        "budget_id" integer NOT NULL,
        "items_subtotal" numeric(12,2) NOT NULL DEFAULT 0,
        "items_tax_total" numeric(12,2) NOT NULL DEFAULT 0,
        "expenses_total" numeric(12,2) NOT NULL DEFAULT 0,
        "entries_total" numeric(12,2) NOT NULL DEFAULT 0,
        "gross_total" numeric(12,2) NOT NULL DEFAULT 0,
        "net_total" numeric(12,2) NOT NULL DEFAULT 0,
        "budget_value" numeric(12,2) NOT NULL DEFAULT 0,
        "difference_total" numeric(12,2) NOT NULL DEFAULT 0,
        "final_balance" numeric(12,2) NOT NULL DEFAULT 0,
        "iva_to_pay" numeric(12,2) NOT NULL DEFAULT 0,
        "profit_margin" numeric(8,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budget_totals" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_budget_totals_budget" UNIQUE ("budget_id"),
        CONSTRAINT "FK_budget_totals_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "budget_filters" (
        "id" SERIAL NOT NULL,
        "budget_id" integer NOT NULL,
        "show_bi_service" boolean NOT NULL DEFAULT true,
        "show_bi_description" boolean NOT NULL DEFAULT true,
        "show_bi_qtd" boolean NOT NULL DEFAULT true,
        "show_bi_price" boolean NOT NULL DEFAULT true,
        "show_bi_tax" boolean NOT NULL DEFAULT true,
        "show_bi_total" boolean NOT NULL DEFAULT true,
        "show_bi_tax_value" boolean NOT NULL DEFAULT true,
        "show_bi_sub_total" boolean NOT NULL DEFAULT true,
        "show_ex_code" boolean NOT NULL DEFAULT true,
        "show_ex_name" boolean NOT NULL DEFAULT true,
        "show_ex_description" boolean NOT NULL DEFAULT true,
        "show_ex_amount" boolean NOT NULL DEFAULT true,
        "show_ex_date" boolean NOT NULL DEFAULT true,
        "show_ex_method" boolean NOT NULL DEFAULT true,
        "show_ex_invoice_number" boolean NOT NULL DEFAULT true,
        "show_ex_filename" boolean NOT NULL DEFAULT true,
        "show_ex_file_path" boolean NOT NULL DEFAULT true,
        "show_en_code" boolean NOT NULL DEFAULT true,
        "show_en_name" boolean NOT NULL DEFAULT true,
        "show_en_description" boolean NOT NULL DEFAULT true,
        "show_en_amount" boolean NOT NULL DEFAULT true,
        "show_en_date" boolean NOT NULL DEFAULT true,
        "show_en_method" boolean NOT NULL DEFAULT true,
        "show_en_received_by" boolean NOT NULL DEFAULT true,
        "show_en_reference" boolean NOT NULL DEFAULT true,
        "show_en_receipt_number" boolean NOT NULL DEFAULT true,
        "show_en_filename" boolean NOT NULL DEFAULT true,
        "show_en_file_path" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budget_filters" PRIMARY KEY ("id"),
        CONSTRAINT "FK_budget_filters_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE
      )
    `);

    const permissionValues = this.resources
      .flatMap((resource) => ['read', 'create', 'update', 'delete'].map((action) => `('${resource}.${action}', '${action} ${resource}')`))
      .join(',');

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "description") VALUES ${permissionValues}
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT roles.id, permissions.id
      FROM "roles"
      CROSS JOIN "permissions"
      WHERE lower(roles.name) = 'master'
        AND permissions.name LIKE ANY($1)
      ON CONFLICT DO NOTHING
    `, [this.resources.map((resource) => `${resource}.%`)]);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT roles.id, permissions.id
      FROM "roles"
      CROSS JOIN "permissions"
      WHERE lower(roles.name) = 'admin'
        AND permissions.name LIKE ANY($1)
      ON CONFLICT DO NOTHING
    `, [this.resources.map((resource) => `${resource}.%`)]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "budget_filters"');
    await queryRunner.query('DROP TABLE "budget_totals"');
    await queryRunner.query('DROP TABLE "entries"');
    await queryRunner.query('DROP TABLE "expenses"');
    await queryRunner.query('DROP TABLE "emails"');
    await queryRunner.query('DROP TABLE "invoices"');
    await queryRunner.query('DROP TABLE "budget_statuses"');
    await queryRunner.query('DROP TABLE "suppliers"');
    await queryRunner.query('DROP TABLE "freelancers"');
    await queryRunner.query('DROP TABLE "budget_items"');
    await queryRunner.query('DROP TABLE "budgets"');
    await queryRunner.query('DROP TABLE "products"');
    await queryRunner.query('DROP TABLE "customers"');
    await queryRunner.query('DROP TABLE "categories"');

    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions" WHERE "name" LIKE ANY($1)
      )
    `, [this.resources.map((resource) => `${resource}.%`)]);
    await queryRunner.query('DELETE FROM "permissions" WHERE "name" LIKE ANY($1)', [this.resources.map((resource) => `${resource}.%`)]);
  }
}
