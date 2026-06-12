import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Budget } from './budget.entity';
import { Category } from './category.entity';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'budget_id' })
  budgetId: number;

  @ManyToOne(() => Budget, (budget) => budget.entries, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'category_id', type: 'integer', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, (category) => category.entries, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp', nullable: true })
  date: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  method: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'received_by', type: 'varchar', length: 120, nullable: true })
  receivedBy: string | null;

  @Column({ type: 'boolean', nullable: true })
  receipt: boolean | null;

  @Column({ name: 'receipt_number', type: 'varchar', length: 120, nullable: true })
  receiptNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filename: string | null;

  @Column({ name: 'file_path', type: 'varchar', length: 512, nullable: true })
  filePath: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

