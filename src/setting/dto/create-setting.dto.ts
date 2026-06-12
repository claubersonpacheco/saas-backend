import { IsOptional, IsString, Length } from 'class-validator';

export class CreateSettingDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  prefix?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  logo?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  logoIcon?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  logoPrint?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  logoWhite?: string;

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
