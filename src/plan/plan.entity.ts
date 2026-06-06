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

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Column({ name: 'project_type', type: 'varchar', length: 100 })
  projectType: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  modules: string[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => Tenant, (tenant) => tenant.plan)
  tenants: Tenant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
