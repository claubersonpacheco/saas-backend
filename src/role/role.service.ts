import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../permission/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(tenantId: number, includeMaster = false): Promise<Role[]> {
    const roles = await this.roleRepository.find({
      where: { tenantId },
      order: { id: 'ASC' },
    });

    if (includeMaster) {
      return roles;
    }

    return roles.filter((role) => role.name.toLowerCase() !== 'master');
  }

  async findOne(id: number, tenantId: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
      relations: {
        permissions: true,
      },
    });
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found.`);
    }

    return role;
  }

  private assertMasterRoleAllowed(roleName: string, allowMaster: boolean): void {
    if (roleName.trim().toLowerCase() === 'master' && !allowMaster) {
      throw new ForbiddenException('Only master users can manage master role.');
    }
  }

  private assertGlobalPermissionsAllowed(
    permissions: Permission[],
    allowGlobalPermissions: boolean,
  ): void {
    if (allowGlobalPermissions) {
      return;
    }

    const hasGlobalPermission = permissions.some(
      (permission) =>
        permission.name.startsWith('tenants.') ||
        permission.name.startsWith('plans.'),
    );

    if (hasGlobalPermission) {
      throw new ForbiddenException(
        'Only master users can assign tenant or plan permissions.',
      );
    }
  }

  private async findPermissions(permissionIds?: number[]): Promise<Permission[]> {
    if (!permissionIds) {
      return [];
    }

    const permissions = await this.permissionRepository.findBy({
      id: In(permissionIds),
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions were not found.');
    }

    return permissions;
  }

  private async syncPermissions(
    role: Role,
    permissionIds: number[] | undefined,
    allowGlobalPermissions: boolean,
  ): Promise<void> {
    if (permissionIds === undefined) {
      return;
    }

    const permissions = await this.findPermissions(permissionIds);
    this.assertGlobalPermissionsAllowed(permissions, allowGlobalPermissions);

    const currentPermissionIds = role.permissions?.map((permission) => permission.id) ?? [];
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
      .of(role.id)
      .addAndRemove(permissionsToAdd, permissionsToRemove);
  }

  async create(
    dto: CreateRoleDto,
    tenantId: number,
    allowMaster = false,
    allowGlobalPermissions = false,
  ): Promise<Role> {
    const name = dto.name.trim();
    this.assertMasterRoleAllowed(name, allowMaster);

    const existing = await this.roleRepository.findOneBy({ name, tenantId });

    if (existing) {
      throw new ConflictException('A role with this name already exists.');
    }

    const role = this.roleRepository.create({
      name,
      tenantId,
      description: dto.description?.trim() || null,
    });

    const createdRole = await this.roleRepository.save(role);
    await this.syncPermissions(
      createdRole,
      dto.permissionIds,
      allowGlobalPermissions,
    );

    return this.findOne(createdRole.id, tenantId);
  }

  async update(
    id: number,
    dto: UpdateRoleDto,
    tenantId: number,
    allowMaster = false,
    allowGlobalPermissions = false,
  ): Promise<Role> {
    const role = await this.findOne(id, tenantId);
    this.assertMasterRoleAllowed(role.name, allowMaster);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      this.assertMasterRoleAllowed(name, allowMaster);

      const existing = await this.roleRepository.findOneBy({ name, tenantId });

      if (existing && existing.id !== id) {
        throw new ConflictException('A role with this name already exists.');
      }
    }

    const updated = this.roleRepository.merge(role, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description?.trim() || null }
        : {}),
    });

    const savedRole = await this.roleRepository.save(updated);
    await this.syncPermissions(role, dto.permissionIds, allowGlobalPermissions);

    return this.findOne(savedRole.id, tenantId);
  }

  async remove(
    id: number,
    tenantId: number,
    allowMaster = false,
  ): Promise<{ message: string }> {
    const role = await this.findOne(id, tenantId);
    this.assertMasterRoleAllowed(role.name, allowMaster);

    await this.roleRepository.remove(role);
    return { message: 'Role deleted successfully.' };
  }
}
