import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @Length(1, 150)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  publicId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  slug?: string;

  @IsString()
  @Length(1, 100)
  projectType: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  price?: string | number;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  currency?: string;

  @IsOptional()
  @IsIn(['monthly', 'yearly', 'lifetime'])
  billingPeriod?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxUsers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxProjects?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxStorageMb?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  modules?: string[];

  @IsOptional()
  @IsBoolean()
  highlighted?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  taxPercentage?: string | number;
}
