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
}
