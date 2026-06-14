import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorageFolderIdToTenants1783100000000 implements MigrationInterface {
  name = 'AddStorageFolderIdToTenants1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tenants_code"');
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN IF EXISTS "code"
    `);
  }
}
