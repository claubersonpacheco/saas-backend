import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTenantStorageFolderIdToCode1783200000000 implements MigrationInterface {
  name = 'RenameTenantStorageFolderIdToCode1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tenants_storage_folder_id"
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'tenants' AND column_name = 'storage_folder_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'tenants' AND column_name = 'code'
        ) THEN
          ALTER TABLE "tenants" RENAME COLUMN "storage_folder_id" TO "code";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "code" uuid
    `);
    await queryRunner.query(`
      UPDATE "tenants"
      SET "code" = gen_random_uuid()
      WHERE "code" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ALTER COLUMN "code" SET DEFAULT gen_random_uuid(),
      ALTER COLUMN "code" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tenants_code"
      ON "tenants" ("code")
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN IF EXISTS "storage_folder_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tenants_code"');
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN IF EXISTS "code"
    `);
  }
}
