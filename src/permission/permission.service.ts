import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './permission.entity';
import {
  filterPermissionsByPlanModules,
  isGlobalPermission,
} from './permission-plan.util';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(
    options: {
      includeTenantPermissions?: boolean;
      planModules?: string[];
    } = {},
  ): Promise<Permission[]> {
    const permissions = await this.permissionRepository.find({
      order: { id: 'ASC' },
    });

    if (options.includeTenantPermissions) {
      return permissions;
    }

    if (options.planModules) {
      return filterPermissionsByPlanModules(permissions, options.planModules);
    }

    return permissions.filter((permission) => !isGlobalPermission(permission.name));
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOneBy({ id });
    if (!permission) {
      throw new NotFoundException(`Permission with id ${id} not found.`);
    }

    return permission;
  }

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const name = dto.name.trim();
    const existing = await this.permissionRepository.findOneBy({ name });

    if (existing) {
      throw new ConflictException('A permission with this name already exists.');
    }

    const permission = this.permissionRepository.create({
      name,
      description: dto.description?.trim() || null,
    });

    return this.permissionRepository.save(permission);
  }

  async update(id: number, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const existing = await this.permissionRepository.findOneBy({ name });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          'A permission with this name already exists.',
        );
      }
    }

    const updated = this.permissionRepository.merge(permission, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description?.trim() || null }
        : {}),
    });

    return this.permissionRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
    return { message: 'Permission deleted successfully.' };
  }
}
