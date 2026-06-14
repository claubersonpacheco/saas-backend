import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  addressType?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  number?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  complement?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  state?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  postal?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  status?: number;

  @IsOptional()
  @IsDateString()
  dateStart?: string;

  @IsOptional()
  @IsDateString()
  dateEnd?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  hourStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  hourEnd?: string;
}
