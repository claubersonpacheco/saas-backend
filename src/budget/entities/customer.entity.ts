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
import { Tenant } from '../../tenant/tenant.entity';
import { Budget } from './budget.entity';
import { Email } from './email.entity';
import { Invoice } from './invoice.entity';

@Entity('customers')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'email'], { unique: true })
@Index(['tenantId', 'document'], { unique: true })
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 80 })
  phone: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  document: string | null;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @OneToMany(() => Budget, (budget) => budget.customer)
  budgets: Budget[];

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];

  @OneToMany(() => Email, (email) => email.customer)
  emails: Email[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

