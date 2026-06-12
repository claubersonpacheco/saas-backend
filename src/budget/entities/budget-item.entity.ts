import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Budget } from './budget.entity';
import { Product } from './product.entity';

@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'budget_id' })
  budgetId: number;

  @ManyToOne(() => Budget, (budget) => budget.items, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, (product) => product.budgetItems, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'integer', default: 0 })
  tax: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  price: string;

  @Column({ name: 'tax_value', type: 'numeric', precision: 10, scale: 2, default: 0 })
  taxValue: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

