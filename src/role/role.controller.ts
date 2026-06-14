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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Role } from './role.entity';
import { RoleService } from './role.service';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  private planModulesFor(user: AuthenticatedUser, isMaster: boolean): string[] | undefined {
    return isMaster ? undefined : (user.tenantPlan?.modules ?? []);
  }

  @Get()
  @RequirePermissions('roles.read')
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<Role[]> {
    return this.roleService.findAll(
      user.tenantId,
      user.role?.name.toLowerCase() === 'master',
    );
  }

  @Get(':id')
  @RequirePermissions('roles.read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Role> {
    const isMaster = user.role?.name.toLowerCase() === 'master';

    return this.roleService.findOne(
      id,
      user.tenantId,
      this.planModulesFor(user, isMaster),
    );
  }

  @Post()
  @RequirePermissions('roles.create')
  create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Role> {
    const isMaster = user.role?.name.toLowerCase() === 'master';

    return this.roleService.create(
      dto,
      user.tenantId,
      isMaster,
      isMaster,
      this.planModulesFor(user, isMaster),
    );
  }

  @Patch(':id')
  @RequirePermissions('roles.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Role> {
    const isMaster = user.role?.name.toLowerCase() === 'master';

    return this.roleService.update(
      id,
      dto,
      user.tenantId,
      isMaster,
      isMaster,
      this.planModulesFor(user, isMaster),
    );
  }

  @Delete(':id')
  @RequirePermissions('roles.delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.roleService.remove(
      id,
      user.tenantId,
      user.role?.name.toLowerCase() === 'master',
    );
  }
}
