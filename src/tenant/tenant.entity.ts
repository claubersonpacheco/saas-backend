import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plan } from '../plan/plan.entity';
import { Role } from '../role/role.entity';
import { Setting } from '../setting/setting.entity';
import { User } from '../user/user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'plan_id', type: 'integer', nullable: true })
  planId: number | null;

  @ManyToOne(() => Plan, (plan) => plan.tenants, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan | null;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => Role, (role) => role.tenant)
  roles: Role[];

  @OneToMany(() => Setting, (setting) => setting.tenant)
  settings: Setting[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
