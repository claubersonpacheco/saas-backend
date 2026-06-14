import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateGlobalSettingDto } from './dto/update-global-setting.dto';
import { GlobalSetting } from './global-setting.entity';
import { GlobalSettingService } from './global-setting.service';

@Controller('global-settings')
@UseGuards(JwtAuthGuard)
export class GlobalSettingController {
  constructor(private readonly globalSettingService: GlobalSettingService) {}

  private assertMaster(user: AuthenticatedUser): void {
    if (user.role?.name.toLowerCase() !== 'master') {
      throw new ForbiddenException('Only master users can manage global settings.');
    }
  }

  @Get('bunny')
  findBunnySettings(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GlobalSetting> {
    this.assertMaster(user);
    return this.globalSettingService.findBunnySettings();
  }

  @Patch('bunny')
  updateBunnySettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGlobalSettingDto,
  ): Promise<GlobalSetting> {
    this.assertMaster(user);
    return this.globalSettingService.updateBunnySettings(dto);
  }
}
