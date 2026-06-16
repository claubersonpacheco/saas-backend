import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalSetting } from '../global-setting/global-setting.entity';
import { BunnyStorageService } from './bunny-storage.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([GlobalSetting])],
  providers: [BunnyStorageService],
  exports: [BunnyStorageService],
})
export class StorageModule {}
