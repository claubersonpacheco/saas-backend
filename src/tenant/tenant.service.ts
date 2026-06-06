import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../plan/plan.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  normalizeSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({ order: { id: 'ASC' } });
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

    return this.tenantRepository.save(tenant);
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

    return this.tenantRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
    return { message: 'Tenant deleted successfully.' };
  }
}
