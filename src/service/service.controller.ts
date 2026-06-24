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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePlanModules } from '../auth/decorators/require-plan-modules.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanModulesGuard } from '../auth/guards/plan-modules.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './service.entity';
import { ServiceService, type ServiceUserOption } from './service.service';

@Controller('services')
@UseGuards(JwtAuthGuard, PlanModulesGuard, PermissionsGuard)
@RequirePlanModules('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  private hasPermission(user: AuthenticatedUser, permission: string): boolean {
    return user.role?.permissions.some((item) => item.name === permission) ?? false;
  }

  private serviceScope(user: AuthenticatedUser) {
    const roleName = user.role?.name.trim().toLowerCase();
    const isAdminRole = roleName === 'admin' || roleName === 'master';

    return {
      tenantId: user.tenantId,
      userId: user.sub,
      canSeeAll: isAdminRole,
      canAssignAll:
        isAdminRole ||
        this.hasPermission(user, 'services.create') ||
        this.hasPermission(user, 'services.update'),
    };
  }

  @Get()
  @RequirePermissions('services.read')
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<Service[]> {
    return this.serviceService.findAll(this.serviceScope(user));
  }

  @Get('users/options')
  @RequirePermissions('services.create', 'services.update')
  findUserOptions(@CurrentUser() user: AuthenticatedUser): Promise<ServiceUserOption[]> {
    return this.serviceService.findTenantUsers(this.serviceScope(user));
  }

  @Get(':id')
  @RequirePermissions('services.read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Service> {
    return this.serviceService.findOne(id, this.serviceScope(user));
  }

  @Post()
  @RequirePermissions('services.create')
  create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Service> {
    return this.serviceService.create(dto, this.serviceScope(user));
  }

  @Patch(':id')
  @RequirePermissions('services.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Service> {
    return this.serviceService.update(id, dto, this.serviceScope(user));
  }

  @Delete(':id')
  @RequirePermissions('services.delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.serviceService.remove(id, this.serviceScope(user));
  }
}
