import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaasCoreSchema1781900000000 implements MigrationInterface {
  name = 'CreateSaasCoreSchema1781900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_tenant_name" UNIQUE ("tenant_id", "name"),
        CONSTRAINT "FK_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" integer NOT NULL,
        "permission_id" integer NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "username" character varying(100) NOT NULL,
        "name" character varying(100) NOT NULL,
        "lastname" character varying(100),
        "email" character varying(150) NOT NULL,
        "suspended" character varying(1) NOT NULL DEFAULT '0',
        "photo_url" character varying(512),
        "role_id" integer,
        "password" character varying(255) NOT NULL,
        "reset_password_token" character varying(255),
        "reset_password_expires" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_tenant_username" UNIQUE ("tenant_id", "username"),
        CONSTRAINT "UQ_users_tenant_email" UNIQUE ("tenant_id", "email"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_users_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "settings" (
        "id" SERIAL NOT NULL,
        "tenant_id" integer NOT NULL,
        "name" character varying(255),
        "logo" character varying(512),
        "logoIcon" character varying(512),
        "logoPrint" character varying(512),
        "logoWhite" character varying(512),
        "bunnyStorageZoneName" character varying(255),
        "bunnyStorageAccessKey" character varying(255),
        "bunnyStorageCdnDomain" character varying(512),
        "bunnyStorageBaseUrl" character varying(512),
        "bunnyStorageUserFolder" character varying(255),
        "bunnyStorageLogoFolder" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_settings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_settings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "description") VALUES
        ('tenants.read', 'List and view tenants'),
        ('tenants.create', 'Create tenants'),
        ('tenants.update', 'Update tenants'),
        ('tenants.delete', 'Delete tenants'),
        ('users.read', 'List and view users'),
        ('users.create', 'Create users'),
        ('users.update', 'Update users'),
        ('users.delete', 'Delete users'),
        ('user.email', 'Update user email'),
        ('roles.read', 'List and view roles'),
        ('roles.create', 'Create roles'),
        ('roles.update', 'Update roles'),
        ('roles.delete', 'Delete roles'),
        ('permissions.read', 'List and view permissions'),
        ('permissions.create', 'Create permissions'),
        ('permissions.update', 'Update permissions'),
        ('permissions.delete', 'Delete permissions'),
        ('settings.read', 'List and view settings'),
        ('settings.create', 'Create settings'),
        ('settings.update', 'Update settings'),
        ('settings.delete', 'Delete settings')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "settings"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TABLE "role_permissions"');
    await queryRunner.query('DROP TABLE "roles"');
    await queryRunner.query('DROP TABLE "permissions"');
    await queryRunner.query('DROP TABLE "tenants"');
  }
}
