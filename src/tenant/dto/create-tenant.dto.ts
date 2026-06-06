import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Length(1, 150)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  planId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  adminUsername?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  adminName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  adminLastname?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  adminPassword?: string;
}
