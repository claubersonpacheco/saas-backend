import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlansToTenants1782000000000 implements MigrationInterface {
  name = 'AddPlansToTenants1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "project_type" character varying(100) NOT NULL,
        "description" character varying,
        "modules" jsonb NOT NULL DEFAULT '[]',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plans" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plans_project_type_slug" UNIQUE ("project_type", "slug")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD "plan_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD CONSTRAINT "FK_tenants_plan"
      FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "description") VALUES
        ('plans.read', 'List and view plans'),
        ('plans.create', 'Create plans'),
        ('plans.update', 'Update plans'),
        ('plans.delete', 'Delete plans')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT roles.id, permissions.id
      FROM "roles"
      CROSS JOIN "permissions"
      WHERE lower(roles.name) = 'master'
        AND permissions.name IN (
          'plans.read',
          'plans.create',
          'plans.update',
          'plans.delete'
        )
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id"
        FROM "permissions"
        WHERE "name" IN (
          'plans.read',
          'plans.create',
          'plans.update',
          'plans.delete'
        )
      )
    `);

    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "name" IN (
        'plans.read',
        'plans.create',
        'plans.update',
        'plans.delete'
      )
    `);

    await queryRunner.query('ALTER TABLE "tenants" DROP CONSTRAINT "FK_tenants_plan"');
    await queryRunner.query('ALTER TABLE "tenants" DROP COLUMN "plan_id"');
    await queryRunner.query('DROP TABLE "plans"');
  }
}
