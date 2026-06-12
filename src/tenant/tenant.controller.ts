import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantAdminPasswordDto } from './dto/update-tenant-admin-password.dto';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @RequirePermissions('tenants.read')
  findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }

  @Get(':id/admin')
  @RequirePermissions('tenants.read')
  findAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.findAdminUser(id);
  }

  @Patch(':id/admin/password')
  @RequirePermissions('tenants.update')
  updateAdminPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantAdminPasswordDto,
  ): Promise<{ message: string }> {
    return this.tenantService.updateAdminPassword(id, dto.password);
  }

  @Get(':id')
  @RequirePermissions('tenants.read')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Tenant> {
    return this.tenantService.findOne(id);
  }

  @Post()
  @RequirePermissions('tenants.create')
  create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.createWithAdmin(dto);
  }

  @Patch(':id')
  @RequirePermissions('tenants.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('tenants.delete')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.tenantService.remove(id);
  }
}
