import { Controller, Get, Param } from '@nestjs/common';
import { BrandingResponse, SettingService } from './setting.service';

@Controller('settings/branding')
export class SettingBrandingController {
  constructor(private readonly settingService: SettingService) {}

  @Get(':tenantSlug')
  findByTenantSlug(
    @Param('tenantSlug') tenantSlug: string,
  ): Promise<BrandingResponse> {
    return this.settingService.findBrandingByTenantSlug(tenantSlug);
  }
}
