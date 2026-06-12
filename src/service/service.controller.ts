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
import { ServiceService } from './service.service';

@Controller('services')
@UseGuards(JwtAuthGuard, PlanModulesGuard, PermissionsGuard)
@RequirePlanModules('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @RequirePermissions('services.read')
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<Service[]> {
    return this.serviceService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('services.read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Service> {
    return this.serviceService.findOne(id, user.tenantId);
  }

  @Post()
  @RequirePermissions('services.create')
  create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Service> {
    return this.serviceService.create(dto, user.sub, user.tenantId);
  }

  @Patch(':id')
  @RequirePermissions('services.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Service> {
    return this.serviceService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @RequirePermissions('services.delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.serviceService.remove(id, user.tenantId);
  }
}
