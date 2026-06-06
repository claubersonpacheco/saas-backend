import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';

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
}
