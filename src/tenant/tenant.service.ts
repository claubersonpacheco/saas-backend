import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { Permission } from '../permission/permission.entity';
import { filterPermissionsByPlanModules } from '../permission/permission-plan.util';
import { Plan } from '../plan/plan.entity';
import { Role } from '../role/role.entity';
import { User } from '../user/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './tenant.entity';

type TenantAdminResponse = Pick<
  User,
  'id' | 'tenantId' | 'username' | 'name' | 'lastname' | 'email' | 'suspended'
>;

const TENANT_ADMIN_PERMISSIONS = [
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
  'services.read',
  'services.create',
  'services.update',
  'services.delete',
];

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  normalizeSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  private normalizeModule(value: string): string {
    return this.normalizeSlug(value);
  }

  findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      relations: { plan: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: { plan: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found.`);
    }

    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: {
        slug: this.normalizeSlug(slug),
        active: true,
      },
      relations: { plan: true },
    });
  }

  private async findPlan(planId?: number | null): Promise<Plan | null> {
    if (planId === undefined || planId === null) {
      return null;
    }

    const plan = await this.planRepository.findOneBy({
      id: planId,
      active: true,
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${planId} not found.`);
    }

    return plan;
  }

  private async getAdminPermissions(plan: Plan | null): Promise<Permission[]> {
    if (!plan) {
      return this.permissionRepository.findBy({
        name: In(TENANT_ADMIN_PERMISSIONS),
      });
    }

    const permissions = await this.permissionRepository.find({
      order: { id: 'ASC' },
    });

    return filterPermissionsByPlanModules(permissions, plan.modules ?? []);
  }

  private async createAdminRole(
    tenantId: number,
    plan: Plan | null,
  ): Promise<Role> {
    const existing = await this.roleRepository.findOneBy({
      tenantId,
      name: 'admin',
    });

    if (existing) {
      return existing;
    }

    const permissions = await this.getAdminPermissions(plan);
    const role = this.roleRepository.create({
      tenantId,
      name: 'admin',
      description: 'Tenant administrator',
      permissions,
    });

    return this.roleRepository.save(role);
  }

  private async syncAdminModulePermissions(
    tenantId: number,
    plan: Plan | null,
  ): Promise<void> {
    const adminRole = await this.roleRepository.findOne({
      where: { tenantId, name: 'admin' },
      relations: { permissions: true },
    });

    if (!adminRole) {
      return;
    }

    const permissions = await this.getAdminPermissions(plan);
    const currentPermissionIds =
      adminRole.permissions?.map((permission) => permission.id) ?? [];
    const nextPermissionIds = permissions.map((permission) => permission.id);
    const permissionsToAdd = nextPermissionIds.filter(
      (permissionId) => !currentPermissionIds.includes(permissionId),
    );
    const permissionsToRemove = currentPermissionIds.filter(
      (permissionId) => !nextPermissionIds.includes(permissionId),
    );

    if (!permissionsToAdd.length && !permissionsToRemove.length) {
      return;
    }

    await this.roleRepository
      .createQueryBuilder()
      .relation(Role, 'permissions')
      .of(adminRole)
      .addAndRemove(permissionsToAdd, permissionsToRemove);
  }

  private async addAdminModulePermissions(
    tenantId: number,
    plan: Plan | null,
  ): Promise<void> {
    const adminRole = await this.roleRepository.findOne({
      where: { tenantId, name: 'admin' },
      relations: { permissions: true },
    });

    if (!adminRole) {
      return;
    }

    const permissions = await this.getAdminPermissions(plan);
    const existingIds = new Set(
      adminRole.permissions?.map((permission) => permission.id) ?? [],
    );
    const permissionsToAdd = permissions.filter(
      (permission) => !existingIds.has(permission.id),
    );

    if (!permissionsToAdd.length) {
      return;
    }

    await this.roleRepository
      .createQueryBuilder()
      .relation(Role, 'permissions')
      .of(adminRole)
      .add(permissionsToAdd);
  }

  private sanitizeAdmin(user: User): TenantAdminResponse {
    return {
      id: user.id,
      tenantId: user.tenantId,
      username: user.username,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      suspended: user.suspended,
    };
  }

  async findAdminUser(tenantId: number): Promise<TenantAdminResponse | null> {
    await this.findOne(tenantId);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.tenant_id = :tenantId', { tenantId })
      .andWhere('LOWER(role.name) = :roleName', { roleName: 'admin' })
      .orderBy('user.id', 'ASC')
      .getOne();

    return user ? this.sanitizeAdmin(user) : null;
  }

  async updateAdminPassword(
    tenantId: number,
    password: string,
  ): Promise<{ message: string }> {
    const admin = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.tenant_id = :tenantId', { tenantId })
      .andWhere('LOWER(role.name) = :roleName', { roleName: 'admin' })
      .orderBy('user.id', 'ASC')
      .getOne();

    if (!admin) {
      throw new NotFoundException(`Admin user for tenant ${tenantId} not found.`);
    }

    await this.userRepository.update(admin.id, {
      password: await bcrypt.hash(password, 10),
    });

    return { message: 'Admin password updated successfully.' };
  }

  private validateAdminPayload(dto: CreateTenantDto): asserts dto is CreateTenantDto & {
    adminUsername: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  } {
    if (
      !dto.adminUsername?.trim() ||
      !dto.adminName?.trim() ||
      !dto.adminEmail?.trim() ||
      !dto.adminPassword
    ) {
      throw new BadRequestException(
        'Informe adminUsername, adminName, adminEmail e adminPassword para criar a empresa.',
      );
    }
  }

  private async createTenantAdmin(
    tenant: Tenant,
    adminRole: Role,
    dto: CreateTenantDto & {
      adminUsername: string;
      adminName: string;
      adminEmail: string;
      adminPassword: string;
    },
  ): Promise<User> {
    const user = this.userRepository.create({
      tenant,
      tenantId: tenant.id,
      username: dto.adminUsername.trim(),
      name: dto.adminName.trim(),
      lastname: dto.adminLastname?.trim() || null,
      email: dto.adminEmail.trim().toLowerCase(),
      suspended: '0',
      photoUrl: null,
      password: await bcrypt.hash(dto.adminPassword, 10),
      role: adminRole,
    });

    return this.userRepository.save(user);
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const name = dto.name.trim();
    const slug = this.normalizeSlug(dto.slug || name);

    if (!slug) {
      throw new ConflictException('Tenant slug is invalid.');
    }

    const existing = await this.tenantRepository.findOneBy({ slug });

    if (existing) {
      throw new ConflictException('A tenant with this slug already exists.');
    }

    const plan = await this.findPlan(dto.planId);
    const tenant = this.tenantRepository.create({
      name,
      slug,
      active: dto.active ?? true,
      plan,
      planId: plan?.id ?? null,
    });

    const createdTenant = await this.tenantRepository.save(tenant);
    await this.createAdminRole(createdTenant.id, plan);
    await this.addAdminModulePermissions(createdTenant.id, plan);

    return createdTenant;
  }

  async createWithAdmin(dto: CreateTenantDto): Promise<Tenant> {
    this.validateAdminPayload(dto);

    const tenant = await this.create(dto);
    const adminRole = await this.createAdminRole(tenant.id, tenant.plan);

    await this.createTenantAdmin(tenant, adminRole, dto);

    return tenant;
  }

  async update(id: number, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    const nextSlug =
      dto.slug !== undefined ? this.normalizeSlug(dto.slug) : undefined;

    if (nextSlug !== undefined) {
      const existing = await this.tenantRepository.findOneBy({ slug: nextSlug });

      if (existing && existing.id !== id) {
        throw new ConflictException('A tenant with this slug already exists.');
      }
    }

    const plan =
      dto.planId !== undefined ? await this.findPlan(dto.planId) : undefined;

    const updated = this.tenantRepository.merge(tenant, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
      ...(dto.planId !== undefined ? { plan, planId: plan?.id ?? null } : {}),
    });

    const savedTenant = await this.tenantRepository.save(updated);

    if (dto.planId !== undefined) {
      await this.syncAdminModulePermissions(savedTenant.id, plan ?? null);
    }

    return this.findOne(savedTenant.id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
    return { message: 'Tenant deleted successfully.' };
  }
}
