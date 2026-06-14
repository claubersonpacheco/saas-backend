import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateGlobalSettingDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  bunnyStorageZoneName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  bunnyStorageAccessKey?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  bunnyStorageCdnDomain?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  bunnyStorageBaseUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  bunnyStorageUserFolder?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  bunnyStorageLogoFolder?: string;
}
