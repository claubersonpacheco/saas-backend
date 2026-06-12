import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { Expense } from './expense.entity';

@Entity('suppliers')
@Index(['tenantId', 'code'], { unique: true })
export class Supplier {
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  phone: string | null;

  @Column({ name: 'service_type', type: 'varchar', length: 120, nullable: true })
  serviceType: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  zip: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  document: string | null;

  @Column({ name: 'account_bank', type: 'varchar', length: 120, nullable: true })
  accountBank: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 120, nullable: true })
  accountNumber: string | null;

  @Column({ type: 'boolean', default: false })
  client: boolean;

  @Column({ name: 'code_client', type: 'varchar', length: 120, nullable: true })
  codeClient: string | null;

  @OneToMany(() => Expense, (expense) => expense.supplier)
  expenses: Expense[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

