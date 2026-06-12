import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { User } from '../../user/user.entity';
import { BudgetFilter } from './budget-filter.entity';
import { BudgetItem } from './budget-item.entity';
import { BudgetStatus } from './budget-status.entity';
import { BudgetTotal } from './budget-total.entity';
import { Customer } from './customer.entity';
import { Email } from './email.entity';
import { Entry } from './entry.entity';
import { Expense } from './expense.entity';
import { Invoice } from './invoice.entity';

@Entity('budgets')
@Index(['tenantId', 'code'], { unique: true })
export class Budget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'show_service', type: 'boolean', default: true })
  showService: boolean;

  @Column({ name: 'show_description', type: 'boolean', default: true })
  showDescription: boolean;

  @Column({ name: 'show_qtd', type: 'boolean', default: true })
  showQtd: boolean;

  @Column({ name: 'show_price', type: 'boolean', default: true })
  showPrice: boolean;

  @Column({ name: 'show_tax', type: 'boolean', default: true })
  showTax: boolean;

  @Column({ name: 'show_total', type: 'boolean', default: true })
  showTotal: boolean;

  @Column({ name: 'show_tax_value', type: 'boolean', default: true })
  showTaxValue: boolean;

  @Column({ name: 'show_sub_total', type: 'boolean', default: true })
  showSubTotal: boolean;

  @Column({ type: 'date', nullable: true })
  date: string | null;

  @Column({ type: 'date', nullable: true })
  expirate: string | null;

  @Column({ name: 'total_expirate', type: 'integer', default: 0 })
  totalExpirate: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.budgets, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => BudgetItem, (item) => item.budget)
  items: BudgetItem[];

  @OneToMany(() => BudgetStatus, (status) => status.budget)
  statuses: BudgetStatus[];

  @OneToMany(() => Expense, (expense) => expense.budget)
  expenses: Expense[];

  @OneToMany(() => Entry, (entry) => entry.budget)
  entries: Entry[];

  @OneToMany(() => Invoice, (invoice) => invoice.budget)
  invoices: Invoice[];

  @OneToMany(() => Email, (email) => email.budget)
  emails: Email[];

  @OneToOne(() => BudgetTotal, (total) => total.budget)
  total: BudgetTotal;

  @OneToMany(() => BudgetFilter, (filter) => filter.budget)
  filters: BudgetFilter[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

