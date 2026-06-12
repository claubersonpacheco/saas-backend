import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrefixToSettings1782800000000 implements MigrationInterface {
  name = 'AddPrefixToSettings1782800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "prefix" character varying(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "settings"
      DROP COLUMN IF EXISTS "prefix"
    `);
  }
}
