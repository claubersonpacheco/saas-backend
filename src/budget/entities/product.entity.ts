import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';
import { BudgetItem } from './budget-item.entity';
import { Category } from './category.entity';

export enum ProductType {
  UNIDADE = 'unidade',
  METROS = 'metro',
  CENTIMETROS = 'centimetro',
  LITROS = 'litros',
  DIA = 'dia',
  HORA = 'hora',
  MINUTO = 'minuto',
}

@Entity('products')
@Index(['tenantId', 'code'], { unique: true })
export class Product {
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

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'product_type',
    type: 'enum',
    enum: ProductType,
  })
  productType: ProductType;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  price: string;

  @Column({ name: 'category_id', type: 'integer', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @OneToMany(() => BudgetItem, (item) => item.product)
  budgetItems: BudgetItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
