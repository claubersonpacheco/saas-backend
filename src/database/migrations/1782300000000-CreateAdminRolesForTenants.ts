import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminRolesForTenants1782300000000
  implements MigrationInterface
{
  name = 'CreateAdminRolesForTenants1782300000000';

  private readonly permissions = [
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'roles.read',
    'roles.create',
    'roles.update',
    'roles.delete',
    'permissions.read',
    'settings.read',
    'settings.create',
    'settings.update',
    'settings.delete',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("tenant_id", "name", "description")
      SELECT tenants.id, 'admin', 'Tenant administrator'
      FROM "tenants"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "roles"
        WHERE "roles"."tenant_id" = tenants.id
          AND lower("roles"."name") = 'admin'
      )
    `);

    await queryRunner.query(
      `
        INSERT INTO "role_permissions" ("role_id", "permission_id")
        SELECT roles.id, permissions.id
        FROM "roles"
        CROSS JOIN "permissions"
        WHERE lower(roles.name) = 'admin'
          AND permissions.name = ANY($1)
        ON CONFLICT DO NOTHING
      `,
      [this.permissions],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE lower("name") = 'admin'
        AND NOT EXISTS (
          SELECT 1
          FROM "users"
          WHERE "users"."role_id" = "roles"."id"
        )
    `);
  }
}
