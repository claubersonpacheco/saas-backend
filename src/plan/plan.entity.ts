import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';

@Entity('plans')
@Index(['projectType', 'slug'], { unique: true })
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120, nullable: true, unique: true })
  code: string | null;

  @Column({ name: 'public_id', type: 'varchar', length: 120, nullable: true, unique: true })
  publicId: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Column({ name: 'project_type', type: 'varchar', length: 100 })
  projectType: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  price: string;

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string;

  @Column({ name: 'billing_period', type: 'varchar', length: 20, default: 'monthly' })
  billingPeriod: string;

  @Column({ name: 'trial_days', type: 'integer', default: 0 })
  trialDays: number;

  @Column({ name: 'max_users', type: 'integer', nullable: true })
  maxUsers: number | null;

  @Column({ name: 'max_projects', type: 'integer', nullable: true })
  maxProjects: number | null;

  @Column({ name: 'max_storage_mb', type: 'integer', nullable: true })
  maxStorageMb: number | null;

  @Column({ type: 'jsonb', nullable: true })
  features: string[] | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  modules: string[];

  @Column({ type: 'boolean', default: false })
  highlighted: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ name: 'tax_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
  taxPercentage: string;

  @OneToMany(() => Tenant, (tenant) => tenant.plan)
  tenants: Tenant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
