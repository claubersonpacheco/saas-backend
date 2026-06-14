import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalSetting } from '../global-setting/global-setting.entity';
import { Setting } from '../setting/setting.entity';
import { BunnyStorageService } from './bunny-storage.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([GlobalSetting, Setting])],
  providers: [BunnyStorageService],
  exports: [BunnyStorageService],
})
export class StorageModule {}
