import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoUrlToUsers1783000000000 implements MigrationInterface {
  name = 'AddPhotoUrlToUsers1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "photo_url" character varying(512)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "photo_url"
    `);
  }
}
