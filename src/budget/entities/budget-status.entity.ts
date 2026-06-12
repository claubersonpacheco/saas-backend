import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/user.entity';
import { Budget } from './budget.entity';

@Entity('budget_statuses')
export class BudgetStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'budget_id' })
  budgetId: number;

  @ManyToOne(() => Budget, (budget) => budget.statuses, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ name: 'changed_by', type: 'integer', nullable: true })
  changedBy: number | null;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by' })
  changedByUser: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

