import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Budget } from './budget.entity';
import { Category } from './category.entity';
import { Supplier } from './supplier.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'budget_id' })
  budgetId: number;

  @ManyToOne(() => Budget, (budget) => budget.expenses, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'supplier_id', type: 'integer', nullable: true })
  supplierId: number | null;

  @ManyToOne(() => Supplier, (supplier) => supplier.expenses, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier | null;

  @Column({ name: 'category_id', type: 'integer', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, (category) => category.expenses, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'timestamp', nullable: true })
  date: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  method: string | null;

  @Column({ type: 'boolean', nullable: true })
  invoice: boolean | null;

  @Column({ name: 'invoice_number', type: 'varchar', length: 120, nullable: true })
  invoiceNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filename: string | null;

  @Column({ name: 'file_path', type: 'varchar', length: 512, nullable: true })
  filePath: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

