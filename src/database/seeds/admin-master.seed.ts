import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Permission } from '../../permission/permission.entity';
import { Role } from '../../role/role.entity';
import { Tenant } from '../../tenant/tenant.entity';
import { User } from '../../user/user.entity';

const normalizeSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

async function seedAdminMaster(): Promise<void> {
  await dataSource.initialize();

  const tenantRepository = dataSource.getRepository(Tenant);
  const permissionRepository = dataSource.getRepository(Permission);
  const roleRepository = dataSource.getRepository(Role);
  const userRepository = dataSource.getRepository(User);

  const tenantName = process.env.SEED_TENANT_NAME ?? 'Minha Empresa';
  const tenantSlug = normalizeSlug(
    process.env.SEED_TENANT_SLUG ?? tenantName,
  );
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL ?? 'admin@minhaempresa.com'
  )
    .trim()
    .toLowerCase();
  const adminUsername = (
    process.env.SEED_ADMIN_USERNAME ?? 'admin'
  ).trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';

  let tenant = await tenantRepository.findOneBy({ slug: tenantSlug });

  if (!tenant) {
    tenant = await tenantRepository.save(
      tenantRepository.create({
        name: tenantName,
        slug: tenantSlug,
        active: true,
      }),
    );
  }

  const permissions = await permissionRepository.find({
    order: { id: 'ASC' },
  });

  let role = await roleRepository.findOne({
    where: { tenantId: tenant.id, name: 'master' },
    relations: { permissions: true },
  });

  if (!role) {
    role = roleRepository.create({
      tenantId: tenant.id,
      name: 'master',
      description: 'Full tenant administrator',
      permissions,
    });
  } else {
    role.permissions = permissions;
  }

  role = await roleRepository.save(role);

  let admin = await userRepository.findOne({
    where: [
      { tenantId: tenant.id, email: adminEmail },
      { tenantId: tenant.id, username: adminUsername },
    ],
  });

  if (!admin) {
    admin = userRepository.create({
      tenant,
      tenantId: tenant.id,
      username: adminUsername,
      name: 'Admin',
      lastname: 'Master',
      email: adminEmail,
      cpfCnpj: null,
      suspended: '0',
      photoUrl: null,
      password: await bcrypt.hash(adminPassword, 10),
      role,
    });
  } else {
    admin.email = adminEmail;
    admin.username = adminUsername;
    admin.suspended = '0';
    admin.password = await bcrypt.hash(adminPassword, 10);
    admin.role = role;
  }

  admin = await userRepository.save(admin);

  console.log('Admin master seed completed.');
  console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`User: ${admin.email}`);
  console.log(`Password: ${adminPassword}`);
}

seedAdminMaster()
  .catch((error) => {
    console.error('Admin master seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
