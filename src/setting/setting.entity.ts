import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.settings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  prefix: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logo: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoIcon: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoPrint: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoWhite: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bunnyStorageZoneName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bunnyStorageAccessKey: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  bunnyStorageCdnDomain: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  bunnyStorageBaseUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bunnyStorageUserFolder: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bunnyStorageLogoFolder: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
