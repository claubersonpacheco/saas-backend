import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateGlobalSettingDto } from './dto/update-global-setting.dto';
import { GlobalSetting } from './global-setting.entity';

@Injectable()
export class GlobalSettingService {
  constructor(
    @InjectRepository(GlobalSetting)
    private readonly globalSettingRepository: Repository<GlobalSetting>,
  ) {}

  async findBunnySettings(): Promise<GlobalSetting> {
    const [setting] = await this.globalSettingRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });

    if (setting) {
      return setting;
    }

    return this.globalSettingRepository.save(
      this.globalSettingRepository.create({
        bunnyStorageUserFolder: 'users',
        bunnyStorageLogoFolder: 'logos',
      }),
    );
  }

  async updateBunnySettings(
    dto: UpdateGlobalSettingDto,
  ): Promise<GlobalSetting> {
    const setting = await this.findBunnySettings();
    const updatedSetting = this.globalSettingRepository.merge(setting, dto);

    return this.globalSettingRepository.save(updatedSetting);
  }
}
