import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMasterRolesForTenants1782200000000
  implements MigrationInterface
{
  name = 'CreateMasterRolesForTenants1782200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("tenant_id", "name", "description")
      SELECT tenants.id, 'master', 'Full tenant administrator'
      FROM "tenants"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "roles"
        WHERE "roles"."tenant_id" = tenants.id
          AND lower("roles"."name") = 'master'
      )
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT roles.id, permissions.id
      FROM "roles"
      CROSS JOIN "permissions"
      WHERE lower(roles.name) = 'master'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE lower("name") = 'master'
        AND NOT EXISTS (
          SELECT 1
          FROM "users"
          WHERE "users"."role_id" = "roles"."id"
        )
    `);
  }
}
