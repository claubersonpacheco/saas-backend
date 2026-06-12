import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServices1782400000000 implements MigrationInterface {
  name = 'CreateServices1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "code" character varying(255) NOT NULL,
        "address_type" smallint NOT NULL DEFAULT 1,
        "address" character varying(255),
        "number" character varying(50),
        "complement" character varying(255),
        "city" character varying(120),
        "state" character varying(80),
        "postal" character varying(30),
        "description" text,
        "status" smallint NOT NULL DEFAULT 2,
        "date_start" date,
        "date_end" date,
        "hour_start" time,
        "hour_end" time,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services" PRIMARY KEY ("id"),
        CONSTRAINT "FK_services_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "description") VALUES
        ('services.read', 'List and view services'),
        ('services.create', 'Create services'),
        ('services.update', 'Update services'),
        ('services.delete', 'Delete services')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "permissions" WHERE "name" IN (
      'services.read',
      'services.create',
      'services.update',
      'services.delete'
    )`);
    await queryRunner.query('DROP TABLE "services"');
  }
}
