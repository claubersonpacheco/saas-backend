import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/user.entity';
import { Budget } from './budget.entity';
import { Customer } from './customer.entity';

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'budget_id' })
  budgetId: number;

  @ManyToOne(() => Budget, (budget) => budget.emails, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.emails, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ name: 'recipient_email', type: 'varchar', length: 255 })
  recipientEmail: string;

  @Column({ name: 'additional_emails', type: 'varchar', length: 255, nullable: true })
  additionalEmails: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'boolean', default: false })
  status: boolean;

  @Column({ name: 'error_message', type: 'varchar', length: 255, nullable: true })
  errorMessage: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  file: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

