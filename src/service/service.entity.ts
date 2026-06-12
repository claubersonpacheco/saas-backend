import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.services, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ name: 'address_type', type: 'smallint', default: 1 })
  addressType: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complement: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  postal: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'smallint', default: 2 })
  status: number;

  @Column({ name: 'date_start', type: 'date', nullable: true })
  dateStart: string | null;

  @Column({ name: 'date_end', type: 'date', nullable: true })
  dateEnd: string | null;

  @Column({ name: 'hour_start', type: 'time', nullable: true })
  hourStart: string | null;

  @Column({ name: 'hour_end', type: 'time', nullable: true })
  hourEnd: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
