import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGlobalSettings1782900000000 implements MigrationInterface {
  name = 'CreateGlobalSettings1782900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "global_settings" (
        "id" SERIAL NOT NULL,
        "bunnyStorageZoneName" character varying(255),
        "bunnyStorageAccessKey" character varying(255),
        "bunnyStorageCdnDomain" character varying(512),
        "bunnyStorageBaseUrl" character varying(512),
        "bunnyStorageUserFolder" character varying(255) DEFAULT 'users',
        "bunnyStorageLogoFolder" character varying(255) DEFAULT 'logos',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_global_settings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "global_settings" ("bunnyStorageUserFolder", "bunnyStorageLogoFolder")
      VALUES ('users', 'logos')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "global_settings"');
  }
}
