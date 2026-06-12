import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Budget } from './budget.entity';

@Entity('budget_filters')
export class BudgetFilter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'budget_id' })
  budgetId: number;

  @ManyToOne(() => Budget, (budget) => budget.filters, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'show_bi_service', type: 'boolean', default: true })
  showBiService: boolean;

  @Column({ name: 'show_bi_description', type: 'boolean', default: true })
  showBiDescription: boolean;

  @Column({ name: 'show_bi_qtd', type: 'boolean', default: true })
  showBiQtd: boolean;

  @Column({ name: 'show_bi_price', type: 'boolean', default: true })
  showBiPrice: boolean;

  @Column({ name: 'show_bi_tax', type: 'boolean', default: true })
  showBiTax: boolean;

  @Column({ name: 'show_bi_total', type: 'boolean', default: true })
  showBiTotal: boolean;

  @Column({ name: 'show_bi_tax_value', type: 'boolean', default: true })
  showBiTaxValue: boolean;

  @Column({ name: 'show_bi_sub_total', type: 'boolean', default: true })
  showBiSubTotal: boolean;

  @Column({ name: 'show_ex_code', type: 'boolean', default: true })
  showExCode: boolean;

  @Column({ name: 'show_ex_name', type: 'boolean', default: true })
  showExName: boolean;

  @Column({ name: 'show_ex_description', type: 'boolean', default: true })
  showExDescription: boolean;

  @Column({ name: 'show_ex_amount', type: 'boolean', default: true })
  showExAmount: boolean;

  @Column({ name: 'show_ex_date', type: 'boolean', default: true })
  showExDate: boolean;

  @Column({ name: 'show_ex_method', type: 'boolean', default: true })
  showExMethod: boolean;

  @Column({ name: 'show_ex_invoice_number', type: 'boolean', default: true })
  showExInvoiceNumber: boolean;

  @Column({ name: 'show_ex_filename', type: 'boolean', default: true })
  showExFilename: boolean;

  @Column({ name: 'show_ex_file_path', type: 'boolean', default: true })
  showExFilePath: boolean;

  @Column({ name: 'show_en_code', type: 'boolean', default: true })
  showEnCode: boolean;

  @Column({ name: 'show_en_name', type: 'boolean', default: true })
  showEnName: boolean;

  @Column({ name: 'show_en_description', type: 'boolean', default: true })
  showEnDescription: boolean;

  @Column({ name: 'show_en_amount', type: 'boolean', default: true })
  showEnAmount: boolean;

  @Column({ name: 'show_en_date', type: 'boolean', default: true })
  showEnDate: boolean;

  @Column({ name: 'show_en_method', type: 'boolean', default: true })
  showEnMethod: boolean;

  @Column({ name: 'show_en_received_by', type: 'boolean', default: true })
  showEnReceivedBy: boolean;

  @Column({ name: 'show_en_reference', type: 'boolean', default: true })
  showEnReference: boolean;

  @Column({ name: 'show_en_receipt_number', type: 'boolean', default: true })
  showEnReceiptNumber: boolean;

  @Column({ name: 'show_en_filename', type: 'boolean', default: true })
  showEnFilename: boolean;

  @Column({ name: 'show_en_file_path', type: 'boolean', default: true })
  showEnFilePath: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

