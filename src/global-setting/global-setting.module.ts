import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalSettingController } from './global-setting.controller';
import { GlobalSetting } from './global-setting.entity';
import { GlobalSettingService } from './global-setting.service';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalSetting])],
  controllers: [GlobalSettingController],
  providers: [GlobalSettingService],
  exports: [GlobalSettingService],
})
export class GlobalSettingModule {}
