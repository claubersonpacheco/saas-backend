import { MigrationInterface, QueryRunner } from 'typeorm';

export class GrantServicesToTenantAdmins1782500000000
  implements MigrationInterface
{
  name = 'GrantServicesToTenantAdmins1782500000000';

  private readonly permissions = [
    'services.read',
    'services.create',
    'services.update',
    'services.delete',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO "role_permissions" ("role_id", "permission_id")
        SELECT roles.id, permissions.id
        FROM "roles"
        CROSS JOIN "permissions"
        INNER JOIN "tenants" ON tenants.id = roles.tenant_id
        INNER JOIN "plans" ON plans.id = tenants.plan_id
        WHERE lower(roles.name) = 'admin'
          AND permissions.name = ANY($1)
          AND plans.modules ? 'services'
        ON CONFLICT DO NOTHING
      `,
      [this.permissions],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DELETE FROM "role_permissions"
        WHERE "permission_id" IN (
          SELECT id
          FROM "permissions"
          WHERE name = ANY($1)
        )
        AND "role_id" IN (
          SELECT roles.id
          FROM "roles"
          INNER JOIN "tenants" ON tenants.id = roles.tenant_id
          INNER JOIN "plans" ON plans.id = tenants.plan_id
          WHERE lower(roles.name) = 'admin'
            AND plans.modules ? 'services'
        )
      `,
      [this.permissions],
    );
  }
}
