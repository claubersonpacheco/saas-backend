import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/user.entity';
import { Budget } from './budget.entity';
import { Customer } from './customer.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'budget_id' })
  budgetId: number;

  @ManyToOne(() => Budget, (budget) => budget.invoices, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.invoices, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 120 })
  serie: string;

  @Column({ type: 'varchar', length: 120 })
  numero: string;

  @Column({ name: 'fecha_emision', type: 'date' })
  fechaEmision: string;

  @Column({ name: 'base_imponible', type: 'numeric', precision: 12, scale: 2 })
  baseImponible: string;

  @Column({ name: 'tipo_iva', type: 'numeric', precision: 5, scale: 2 })
  tipoIva: string;

  @Column({ name: 'cuota_iva', type: 'numeric', precision: 12, scale: 2 })
  cuotaIva: string;

  @Column({ name: 'importe_total', type: 'numeric', precision: 12, scale: 2 })
  importeTotal: string;

  @Column({ name: 'hash_registro', type: 'varchar', length: 255, nullable: true })
  hashRegistro: string | null;

  @Column({ name: 'hash_registro_anterior', type: 'varchar', length: 255, nullable: true })
  hashRegistroAnterior: string | null;

  @Column({ name: 'estado_aeat', type: 'varchar', length: 80, default: 'pendente' })
  estadoAeat: string;

  @Column({ name: 'pdf_url', type: 'varchar', length: 512, nullable: true })
  pdfUrl: string | null;

  @Column({ name: 'xml_url', type: 'varchar', length: 512, nullable: true })
  xmlUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

