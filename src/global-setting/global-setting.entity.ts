import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('global_settings')
export class GlobalSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bunnyStorageZoneName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bunnyStorageAccessKey: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  bunnyStorageCdnDomain: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  bunnyStorageBaseUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'users' })
  bunnyStorageUserFolder: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'logos' })
  bunnyStorageLogoFolder: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
