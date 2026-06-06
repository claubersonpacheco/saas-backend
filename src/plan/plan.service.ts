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
      name,
      slug,
      projectType,
      description: dto.description?.trim() || null,
      modules: this.normalizeModules(dto.modules),
      active: dto.active ?? true,
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
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.slug !== undefined ? { slug: nextSlug } : {}),
      ...(dto.projectType !== undefined ? { projectType: nextProjectType } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description?.trim() || null }
        : {}),
      ...(dto.modules !== undefined
        ? { modules: this.normalizeModules(dto.modules) }
        : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
    });

    return this.planRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const plan = await this.findOne(id);
    await this.planRepository.remove(plan);
    return { message: 'Plan deleted successfully.' };
  }
}
