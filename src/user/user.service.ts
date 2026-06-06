import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { Permission } from '../permission/permission.entity';
import { Role } from '../role/role.entity';
import { Setting } from '../setting/setting.entity';
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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenantService: TenantService,
  ) {}

  private sanitizeUser(user: User): UserResponse {
    const { password, ...safeUser } = user;
    void password;

    return safeUser;
  }

  private normalizeCpfCnpj(value?: string | null): string | null {
    const digits = value?.replace(/\D/g, '') ?? '';

    if (!digits) {
      return null;
    }

    if (![11, 14].includes(digits.length)) {
      throw new BadRequestException('Informe um CPF ou CNPJ valido.');
    }

    return digits;
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

  async findOne(id: number, tenantId?: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: tenantId ? { id, tenantId } : { id },
      relations: { tenant: { plan: true } },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found.`);
    }

    return this.sanitizeUser(user);
  }

  async create(
    createUserDto: CreateUserDto,
    currentTenantId?: number,
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
      : await this.findOrCreateMasterRole(tenant.id);

    if (roleId && !role) {
      throw new NotFoundException(`Role with id ${roleId} not found.`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...userPayload,
      tenant,
      tenantId: tenant.id,
      email: normalizedEmail,
      username: normalizedUsername,
      cpfCnpj: this.normalizeCpfCnpj(createUserDto.cpfCnpj),
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

  private async findOrCreateMasterRole(tenantId: number): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { tenantId, name: 'master' },
      relations: { permissions: true },
    });

    if (existing) {
      return existing;
    }

    const permissions = await this.permissionRepository.find();
    const role = this.roleRepository.create({
      tenantId,
      name: 'master',
      description: 'Full tenant administrator',
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
    id: number,
    updateUserDto: UpdateUserDto,
    tenantId: number,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      select: this.userPasswordSelect(),
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found.`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const normalizedEmail = updateUserDto.email.trim().toLowerCase();
      const existingUser = await this.userRepository.findOneBy({
        tenantId,
        email: normalizedEmail,
      });

      if (existingUser && existingUser.id !== id) {
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

      if (existingUsername && existingUsername.id !== id) {
        throw new ConflictException(
          'A user with this username already exists in this tenant.',
        );
      }

      updateUserDto.username = normalizedUsername;
    }

    const { roleId, ...payload } = updateUserDto;

    if (payload.cpfCnpj !== undefined) {
      payload.cpfCnpj = this.normalizeCpfCnpj(payload.cpfCnpj) ?? undefined;
    }

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

    const updatedUser = this.userRepository.merge(user, {
      ...payload,
      ...(roleId !== undefined ? { role } : {}),
    });

    return this.sanitizeUser(await this.userRepository.save(updatedUser));
  }

  private userPasswordSelect() {
    return {
      id: true,
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
      cpfCnpj: true,
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

  private async getBunnyStorageConfig(tenantId: number): Promise<{
    zoneName: string;
    accessKey: string;
    publicBaseUrl: string;
    userFolder: string;
  }> {
    const [setting] = await this.settingRepository.find({
      where: { tenantId },
      order: { id: 'DESC' },
      take: 1,
    });
    const zoneName = setting?.bunnyStorageZoneName?.trim();
    const accessKey = setting?.bunnyStorageAccessKey?.trim();
    const publicBaseUrl = (
      setting?.bunnyStorageCdnDomain ||
      setting?.bunnyStorageBaseUrl ||
      ''
    )
      .trim()
      .replace(/\/+$/, '');

    if (!zoneName || !accessKey || !publicBaseUrl) {
      throw new BadRequestException(
        'Configure bunnyStorageZoneName, bunnyStorageAccessKey e bunnyStorageCdnDomain/baseUrl antes de enviar fotos.',
      );
    }

    return {
      zoneName,
      accessKey,
      publicBaseUrl: /^https?:\/\//.test(publicBaseUrl)
        ? publicBaseUrl
        : `https://${publicBaseUrl}`,
      userFolder: setting?.bunnyStorageUserFolder?.trim() || 'users',
    };
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
    id: number,
    tenantId: number,
    file?: UploadedImageFile,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOneBy({ id, tenantId });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found.`);
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

    const config = await this.getBunnyStorageConfig(tenantId);
    const fileName = `${user.id}-${Date.now()}-${this.sanitizePathSegment(
      user.username,
    )}.${extension}`;
    const storagePath = `${config.userFolder.replace(/\/+$/, '')}/${fileName}`;
    const uploadUrl = `https://storage.bunnycdn.com/${config.zoneName}/${storagePath}`;
    const uploadBody = new ArrayBuffer(file.buffer.byteLength);
    new Uint8Array(uploadBody).set(file.buffer);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        AccessKey: config.accessKey,
        'Content-Type': file.mimetype,
      },
      body: uploadBody,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new BadRequestException(
        `Nao foi possivel enviar a foto para Bunny Storage. ${body || response.statusText}`,
      );
    }

    user.photoUrl = `${config.publicBaseUrl}/${storagePath}`;
    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async remove(id: number, tenantId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      select: this.userPasswordSelect(),
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found.`);
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
