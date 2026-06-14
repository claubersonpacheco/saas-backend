import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, QueryFailedError, Repository } from 'typeorm';
import { Permission } from '../permission/permission.entity';
import { Role } from '../role/role.entity';
import { BunnyStorageService } from '../storage/bunny-storage.service';
import { Tenant } from '../tenant/tenant.entity';
import { TenantService } from '../tenant/tenant.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

export type UserResponse = Omit<User, 'password'>;
export type UserWithPassword = User;

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

type UserWriteOptions = {
  allowMasterRole?: boolean;
};

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
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenantService: TenantService,
    private readonly bunnyStorageService: BunnyStorageService,
  ) {}

  private sanitizeUser(user: User): UserResponse {
    const { password, ...safeUser } = user;
    void password;

    return safeUser;
  }

  private async resolveTenant(
    dto: CreateUserDto,
    currentTenantId?: number,
  ): Promise<Tenant> {
    if (currentTenantId) {
      return this.tenantService.findOne(currentTenantId);
    }

    if (dto.tenantId) {
      return this.tenantService.findOne(dto.tenantId);
    }

    if (dto.tenantSlug) {
      const tenant = await this.tenantService.findBySlug(dto.tenantSlug);

      if (tenant) {
        return tenant;
      }

      if (dto.tenantName) {
        return this.tenantService.create({
          name: dto.tenantName,
          slug: dto.tenantSlug,
        });
      }

      throw new NotFoundException(
        `Tenant with slug ${dto.tenantSlug} not found.`,
      );
    }

    return this.tenantService.create({
      name: dto.tenantName || dto.name,
      slug: dto.tenantSlug || dto.username,
    });
  }

  async findAll(tenantId: number): Promise<UserResponse[]> {
    const users = await this.userRepository.find({
      where: { tenantId },
      order: {
        id: 'ASC',
      },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  private userIdentifierWhere(identifier: string | number, tenantId?: number) {
    const value = String(identifier);
    const base = tenantId ? { tenantId } : {};

    if (/^\d+$/.test(value)) {
      return { ...base, id: Number(value) };
    }

    return { ...base, uuid: value };
  }

  async findOne(
    identifier: string | number,
    tenantId?: number,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: this.userIdentifierWhere(identifier, tenantId),
      relations: { tenant: { plan: true } },
    });

    if (!user) {
      throw new NotFoundException(`User ${identifier} not found.`);
    }

    return this.sanitizeUser(user);
  }

  async create(
    createUserDto: CreateUserDto,
    currentTenantId?: number,
    options: UserWriteOptions = {},
  ): Promise<UserResponse> {
    const tenant = await this.resolveTenant(createUserDto, currentTenantId);
    const normalizedEmail = createUserDto.email.trim().toLowerCase();
    const normalizedUsername = createUserDto.username.trim();
    const { roleId, tenantId, tenantName, tenantSlug, ...userPayload } =
      createUserDto;
    void tenantId;
    void tenantName;
    void tenantSlug;

    const existingUser = await this.userRepository.findOneBy({
      tenantId: tenant.id,
      email: normalizedEmail,
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists in this tenant.',
      );
    }

    const existingUsername = await this.userRepository.findOneBy({
      tenantId: tenant.id,
      username: normalizedUsername,
    });

    if (existingUsername) {
      throw new ConflictException(
        'A user with this username already exists in this tenant.',
      );
    }

    const role = roleId
      ? await this.roleRepository.findOneBy({ id: roleId, tenantId: tenant.id })
      : await this.findOrCreateAdminRole(tenant.id);

    if (roleId && !role) {
      throw new NotFoundException(`Role with id ${roleId} not found.`);
    }

    if (
      role?.name.toLowerCase() === 'master' &&
      options.allowMasterRole !== true
    ) {
      throw new ForbiddenException('Only master users can assign master role.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...userPayload,
      tenant,
      tenantId: tenant.id,
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      role,
    });

    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async findByIdentifierWithPassword(
    identifier: string,
    tenantSlug?: string,
  ): Promise<UserWithPassword | null> {
    const normalizedIdentifier = identifier.trim();
    const where = [
      { email: normalizedIdentifier.toLowerCase() },
      { username: normalizedIdentifier },
    ];

    if (tenantSlug) {
      const tenant = await this.tenantService.findBySlug(tenantSlug);

      if (!tenant) {
        return null;
      }

      return this.userRepository.findOne({
        where: where.map((item) => ({ ...item, tenantId: tenant.id })),
        relations: { tenant: { plan: true } },
        select: this.userPasswordSelect(),
      });
    }

    const users = await this.userRepository.find({
      where,
      relations: { tenant: { plan: true } },
      select: this.userPasswordSelect(),
      take: 2,
    });

    if (users.length > 1) {
      throw new BadRequestException(
        'Este usuario existe em mais de um tenant. Informe tenantSlug no login.',
      );
    }

    return users[0] ?? null;
  }

  private async findOrCreateAdminRole(tenantId: number): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { tenantId, name: 'admin' },
      relations: { permissions: true },
    });

    if (existing) {
      return existing;
    }

    const permissions = await this.permissionRepository.findBy({
      name: In(TENANT_ADMIN_PERMISSIONS),
    });
    const role = this.roleRepository.create({
      tenantId,
      name: 'admin',
      description: 'Tenant administrator',
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async findByIdWithPassword(userId: number): Promise<UserWithPassword | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: { tenant: { plan: true } },
      select: this.userPasswordSelect(),
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: { tenant: { plan: true } },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetPasswordToken: token },
      relations: { tenant: { plan: true } },
      select: {
        ...this.userPasswordSelect(),
        resetPasswordToken: true,
        resetPasswordExpires: true,
      },
    });
  }

  async updateResetToken(
    userId: number,
    resetPasswordToken: string | null,
    resetPasswordExpires: Date | null,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      resetPasswordToken,
      resetPasswordExpires,
    });
  }

  async updatePassword(userId: number, password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  async update(
    id: string | number,
    updateUserDto: UpdateUserDto,
    tenantId: number,
    options: UserWriteOptions = {},
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: this.userIdentifierWhere(id, tenantId),
      select: this.userPasswordSelect(),
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const normalizedEmail = updateUserDto.email.trim().toLowerCase();
      const existingUser = await this.userRepository.findOneBy({
        tenantId,
        email: normalizedEmail,
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException(
          'A user with this email already exists in this tenant.',
        );
      }

      updateUserDto.email = normalizedEmail;
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const normalizedUsername = updateUserDto.username.trim();
      const existingUsername = await this.userRepository.findOneBy({
        tenantId,
        username: normalizedUsername,
      });

      if (existingUsername && existingUsername.id !== user.id) {
        throw new ConflictException(
          'A user with this username already exists in this tenant.',
        );
      }

      updateUserDto.username = normalizedUsername;
    }

    const { roleId, ...payload } = updateUserDto;

    if (updateUserDto.password) {
      payload.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const role =
      roleId !== undefined && roleId !== null
        ? await this.roleRepository.findOneBy({ id: roleId, tenantId })
        : roleId === null
          ? null
          : undefined;

    if (roleId !== undefined && roleId !== null && !role) {
      throw new NotFoundException(`Role with id ${roleId} not found.`);
    }

    if (
      role?.name.toLowerCase() === 'master' &&
      options.allowMasterRole !== true
    ) {
      throw new ForbiddenException('Only master users can assign master role.');
    }

    const updatedUser = this.userRepository.merge(user, {
      ...payload,
      ...(roleId !== undefined ? { role } : {}),
    });

    return this.sanitizeUser(await this.userRepository.save(updatedUser));
  }

  private userPasswordSelect() {
    return {
      id: true,
      uuid: true,
      tenantId: true,
      tenant: {
        id: true,
        name: true,
        slug: true,
        active: true,
        planId: true,
        plan: {
          id: true,
          name: true,
          slug: true,
          projectType: true,
          modules: true,
          active: true,
        },
      },
      username: true,
      name: true,
      lastname: true,
      email: true,
      suspended: true,
      photoUrl: true,
      password: true,
      role: true,
      resetPasswordToken: true,
      resetPasswordExpires: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private getImageExtension(file: UploadedImageFile): string {
    const extensionByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    return extensionByMime[file.mimetype] ?? '';
  }

  private sanitizePathSegment(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  async uploadPhoto(
    id: string | number,
    tenantId: number,
    file?: UploadedImageFile,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: this.userIdentifierWhere(id, tenantId),
      relations: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }

    if (!file) {
      throw new BadRequestException('Selecione uma foto para enviar.');
    }

    const extension = this.getImageExtension(file);

    if (!extension) {
      throw new BadRequestException('Envie uma foto JPG, PNG, WEBP ou GIF.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('A foto deve ter no maximo 5MB.');
    }

    const config = await this.bunnyStorageService.getConfig(tenantId);
    const fileName = `${user.id}-${Date.now()}-${this.sanitizePathSegment(
      user.username,
    )}.${extension}`;
    const storagePath = this.bunnyStorageService.buildStoragePath({
      tenantId,
      tenantFolder: user.tenant.code,
      tenantIsCentral: user.tenant.planId === null,
      folder: config.userFolder,
      defaultFolder: 'users',
      fileName,
    });
    const photoUrl = await this.bunnyStorageService.upload(
      storagePath,
      file,
      tenantId,
    );

    const previousPhotoUrl = user.photoUrl;
    user.photoUrl = photoUrl;
    await this.userRepository.save(user);

    if (previousPhotoUrl && previousPhotoUrl !== photoUrl) {
      await this.bunnyStorageService.deleteByUrl(previousPhotoUrl, tenantId);
    }

    return this.findOne(user.id, tenantId);
  }

  async removePhoto(
    id: string | number,
    tenantId: number,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: this.userIdentifierWhere(id, tenantId),
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }

    const previousPhotoUrl = user.photoUrl;
    user.photoUrl = null;
    await this.userRepository.save(user);

    if (previousPhotoUrl) {
      try {
        await this.bunnyStorageService.deleteByUrl(previousPhotoUrl, tenantId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Nao foi possivel apagar a foto antiga do usuario ${id}: ${message}`,
        );
      }
    }

    return this.findOne(user.id, tenantId);
  }

  async remove(
    id: string | number,
    tenantId: number,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: this.userIdentifierWhere(id, tenantId),
      select: this.userPasswordSelect(),
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }

    try {
      await this.userRepository.remove(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };

        if (driverError.code === '23503') {
          throw new ConflictException(
            'Nao foi possivel excluir este usuario porque existem registros vinculados a ele.',
          );
        }
      }

      throw error;
    }

    return {
      message: 'User deleted successfully.',
    };
  }
}
