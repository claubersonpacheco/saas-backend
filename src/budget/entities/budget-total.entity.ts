import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Budget } from './budget.entity';

@Entity('budget_totals')
export class BudgetTotal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'budget_id', unique: true })
  budgetId: number;

  @OneToOne(() => Budget, (budget) => budget.total, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'items_subtotal', type: 'numeric', precision: 12, scale: 2, default: 0 })
  itemsSubtotal: string;

  @Column({ name: 'items_tax_total', type: 'numeric', precision: 12, scale: 2, default: 0 })
  itemsTaxTotal: string;

  @Column({ name: 'expenses_total', type: 'numeric', precision: 12, scale: 2, default: 0 })
  expensesTotal: string;

  @Column({ name: 'entries_total', type: 'numeric', precision: 12, scale: 2, default: 0 })
  entriesTotal: string;

  @Column({ name: 'gross_total', type: 'numeric', precision: 12, scale: 2, default: 0 })
  grossTotal: string;

  @Column({ name: 'net_total', type: 'numeric', precision: 12, scale: 2, default: 0 })
  netTotal: string;

  @Column({ name: 'budget_value', type: 'numeric', precision: 12, scale: 2, default: 0 })
  budgetValue: string;

  @Column({ name: 'difference_total', type: 'numeric', precision: 12, scale: 2, default: 0 })
  differenceTotal: string;

  @Column({ name: 'final_balance', type: 'numeric', precision: 12, scale: 2, default: 0 })
  finalBalance: string;

  @Column({ name: 'iva_to_pay', type: 'numeric', precision: 12, scale: 2, default: 0 })
  ivaToPay: string;

  @Column({ name: 'profit_margin', type: 'numeric', precision: 8, scale: 2, default: 0 })
  profitMargin: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

