import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './plan.entity';

@Injectable()
export class PlanService {
  constructor(
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

  normalizeProjectType(value: string): string {
    return this.normalizeSlug(value);
  }

  normalizeModules(modules?: string[]): string[] {
    if (!modules) {
      return [];
    }

    return [...new Set(modules.map((module) => this.normalizeSlug(module)))]
      .filter(Boolean)
      .sort();
  }

  private normalizeString(value?: string): string | null {
    return value?.trim() || null;
  }

  private normalizeDecimal(value?: string | number): string {
    return value === undefined || value === '' ? '0' : String(value);
  }

  findAll(projectType?: string): Promise<Plan[]> {
    return this.planRepository.find({
      where: projectType
        ? { projectType: this.normalizeProjectType(projectType) }
        : {},
      order: { projectType: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Plan> {
    const plan = await this.planRepository.findOneBy({ id });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found.`);
    }

    return plan;
  }

  async create(dto: CreatePlanDto): Promise<Plan> {
    const name = dto.name.trim();
    const slug = this.normalizeSlug(dto.slug || name);
    const projectType = this.normalizeProjectType(dto.projectType);

    if (!slug || !projectType) {
      throw new ConflictException('Plan slug or project type is invalid.');
    }

    const existing = await this.planRepository.findOneBy({
      slug,
      projectType,
    });

    if (existing) {
      throw new ConflictException(
        'A plan with this slug already exists for this project type.',
      );
    }

    const plan = this.planRepository.create({
      code: this.normalizeString(dto.code),
      publicId: this.normalizeString(dto.publicId),
      name,
      slug,
      projectType,
      description: dto.description?.trim() || null,
      price: this.normalizeDecimal(dto.price),
      currency: dto.currency?.trim().toUpperCase() || 'EUR',
      billingPeriod: dto.billingPeriod || 'monthly',
      trialDays: dto.trialDays ?? 0,
      maxUsers: dto.maxUsers ?? null,
      maxProjects: dto.maxProjects ?? null,
      maxStorageMb: dto.maxStorageMb ?? null,
      features: dto.features ?? null,
      modules: this.normalizeModules(dto.modules),
      highlighted: dto.highlighted ?? false,
      active: dto.active ?? true,
      isPublic: dto.isPublic ?? true,
      sortOrder: dto.sortOrder ?? 0,
      taxPercentage: this.normalizeDecimal(dto.taxPercentage),
    });

    return this.planRepository.save(plan);
  }

  async update(id: number, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    const nextProjectType =
      dto.projectType !== undefined
        ? this.normalizeProjectType(dto.projectType)
        : plan.projectType;
    const nextSlug =
      dto.slug !== undefined ? this.normalizeSlug(dto.slug) : plan.slug;

    if (!nextProjectType || !nextSlug) {
      throw new ConflictException('Plan slug or project type is invalid.');
    }

    if (dto.slug !== undefined || dto.projectType !== undefined) {
      const existing = await this.planRepository.findOneBy({
        slug: nextSlug,
        projectType: nextProjectType,
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          'A plan with this slug already exists for this project type.',
        );
      }
    }

    const updated = this.planRepository.merge(plan, {
      ...(dto.code !== undefined ? { code: this.normalizeString(dto.code) } : {}),
      ...(dto.publicId !== undefined ? { publicId: this.normalizeString(dto.publicId) } : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.slug !== undefined ? { slug: nextSlug } : {}),
      ...(dto.projectType !== undefined ? { projectType: nextProjectType } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description?.trim() || null }
        : {}),
      ...(dto.price !== undefined ? { price: this.normalizeDecimal(dto.price) } : {}),
      ...(dto.currency !== undefined
        ? { currency: dto.currency.trim().toUpperCase() || 'EUR' }
        : {}),
      ...(dto.billingPeriod !== undefined ? { billingPeriod: dto.billingPeriod } : {}),
      ...(dto.trialDays !== undefined ? { trialDays: dto.trialDays } : {}),
      ...(dto.maxUsers !== undefined ? { maxUsers: dto.maxUsers ?? null } : {}),
      ...(dto.maxProjects !== undefined ? { maxProjects: dto.maxProjects ?? null } : {}),
      ...(dto.maxStorageMb !== undefined
        ? { maxStorageMb: dto.maxStorageMb ?? null }
        : {}),
      ...(dto.features !== undefined ? { features: dto.features } : {}),
      ...(dto.modules !== undefined
        ? { modules: this.normalizeModules(dto.modules) }
        : {}),
      ...(dto.highlighted !== undefined ? { highlighted: dto.highlighted } : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
      ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.taxPercentage !== undefined
        ? { taxPercentage: this.normalizeDecimal(dto.taxPercentage) }
        : {}),
    });

    return this.planRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const plan = await this.findOne(id);
    await this.planRepository.remove(plan);
    return { message: 'Plan deleted successfully.' };
  }
}
