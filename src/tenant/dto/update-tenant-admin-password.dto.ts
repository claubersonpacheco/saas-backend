import { IsString, MinLength } from 'class-validator';

export class UpdateTenantAdminPasswordDto {
  @IsString()
  @MinLength(8)
  password: string;
}
