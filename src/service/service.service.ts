import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './service.entity';

export type ServiceUserOption = Pick<
  User,
  'id' | 'username' | 'name' | 'lastname' | 'email'
>;

type ServiceAccessScope = {
  tenantId: number;
  userId: number;
  canSeeAll: boolean;
};

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(scope: ServiceAccessScope): Promise<Service[]> {
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .innerJoinAndSelect('service.user', 'user')
      .where('user.tenant_id = :tenantId', { tenantId: scope.tenantId });

    if (!scope.canSeeAll) {
      query.andWhere('service.user_id = :userId', { userId: scope.userId });
    }

    return query.orderBy('service.id', 'ASC').getMany();
  }

  async findOne(id: number, scope: ServiceAccessScope): Promise<Service> {
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .innerJoinAndSelect('service.user', 'user')
      .where('service.id = :id', { id })
      .andWhere('user.tenant_id = :tenantId', { tenantId: scope.tenantId });

    if (!scope.canSeeAll) {
      query.andWhere('service.user_id = :userId', { userId: scope.userId });
    }

    const service = await query.getOne();

    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found.`);
    }

    return service;
  }

  findTenantUsers(scope: ServiceAccessScope): Promise<ServiceUserOption[]> {
    return this.userRepository.find({
      select: {
        id: true,
        username: true,
        name: true,
        lastname: true,
        email: true,
      },
      where: scope.canSeeAll
        ? { tenantId: scope.tenantId }
        : { id: scope.userId, tenantId: scope.tenantId },
      order: {
        name: 'ASC',
        username: 'ASC',
      },
    });
  }

  async create(dto: CreateServiceDto, scope: ServiceAccessScope): Promise<Service> {
    this.ensureAssignableUser(dto.userId, scope);
    const user = await this.findTenantUser(dto.userId, scope.tenantId);

    await this.ensureCodeAvailable(dto.code, scope.tenantId);

    const service = this.serviceRepository.create({
      ...this.normalizePayload(dto),
      user,
      userId: user.id,
    });

    return this.serviceRepository.save(service);
  }

  async update(id: number, dto: UpdateServiceDto, scope: ServiceAccessScope): Promise<Service> {
    const service = await this.findOne(id, scope);

    if (dto.code !== undefined) {
      await this.ensureCodeAvailable(dto.code, scope.tenantId, id);
    }

    const updated = this.serviceRepository.merge(service, this.normalizePayload(dto));

    if (dto.userId !== undefined) {
      this.ensureAssignableUser(dto.userId, scope);
      const user = await this.findTenantUser(dto.userId, scope.tenantId);
      updated.user = user;
      updated.userId = user.id;
    }

    return this.serviceRepository.save(updated);
  }

  async remove(id: number, scope: ServiceAccessScope): Promise<{ message: string }> {
    const service = await this.findOne(id, scope);

    await this.serviceRepository.remove(service);

    return { message: 'Service deleted successfully.' };
  }

  private normalizePayload(dto: CreateServiceDto | UpdateServiceDto): Partial<Service> {
    return {
      ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
      ...(dto.addressType !== undefined ? { addressType: dto.addressType } : {}),
      ...(dto.address !== undefined ? { address: dto.address?.trim() || null } : {}),
      ...(dto.number !== undefined ? { number: dto.number?.trim() || null } : {}),
      ...(dto.complement !== undefined ? { complement: dto.complement?.trim() || null } : {}),
      ...(dto.city !== undefined ? { city: dto.city?.trim() || null } : {}),
      ...(dto.state !== undefined ? { state: dto.state?.trim() || null } : {}),
      ...(dto.postal !== undefined ? { postal: dto.postal?.trim() || null } : {}),
      ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.dateStart !== undefined ? { dateStart: dto.dateStart || null } : {}),
      ...(dto.dateEnd !== undefined ? { dateEnd: dto.dateEnd || null } : {}),
      ...(dto.hourStart !== undefined ? { hourStart: dto.hourStart || null } : {}),
      ...(dto.hourEnd !== undefined ? { hourEnd: dto.hourEnd || null } : {}),
    };
  }

  private async findTenantUser(userId: number, tenantId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId, tenantId });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found.`);
    }

    return user;
  }

  private ensureAssignableUser(userId: number, scope: ServiceAccessScope): void {
    if (!scope.canSeeAll && userId !== scope.userId) {
      throw new ForbiddenException('User cannot assign services to another user.');
    }
  }

  private async ensureCodeAvailable(
    code: string,
    tenantId: number,
    ignoreId?: number,
  ): Promise<void> {
    const normalizedCode = code.trim();
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .innerJoin('service.user', 'user')
      .where('user.tenant_id = :tenantId', { tenantId })
      .andWhere('service.code = :code', { code: normalizedCode });

    if (ignoreId) {
      query.andWhere('service.id != :ignoreId', { ignoreId });
    }

    if (await query.getExists()) {
      throw new ConflictException('Código já está em uso.');
    }
  }
}
