import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUuidToUsers1783300000000 implements MigrationInterface {
  name = 'AddUuidToUsers1783300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "uuid" uuid NOT NULL DEFAULT gen_random_uuid()
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_uuid" ON "users" ("uuid")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_uuid"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "uuid"');
  }
}
