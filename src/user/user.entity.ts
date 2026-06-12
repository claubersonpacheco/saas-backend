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
import { Role } from '../role/role.entity';
import { Service } from '../service/service.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('users')
@Index(['tenantId', 'username'], { unique: true })
@Index(['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastname: string | null;

  @Column({ length: 150 })
  email: string;

  @Column({ length: 1, default: '0' })
  suspended: string;

  @Column({ name: 'photo_url', type: 'varchar', length: 512, nullable: true })
  photoUrl: string | null;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @Column({ length: 255, select: false })
  password: string;

  @OneToMany(() => Service, (service) => service.user)
  services: Service[];

  @Column({ name: 'reset_password_token', type: 'varchar', length: 255, nullable: true })
  resetPasswordToken: string | null;

  @Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
