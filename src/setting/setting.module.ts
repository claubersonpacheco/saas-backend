import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { Tenant } from '../tenant/tenant.entity';
import { SettingBrandingController } from './setting-branding.controller';
import { SettingController } from './setting.controller';
import { Setting } from './setting.entity';
import { SettingService } from './setting.service';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, Tenant]), StorageModule],
  controllers: [SettingController, SettingBrandingController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
