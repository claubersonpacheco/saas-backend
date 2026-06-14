import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse, UserService } from './user.service';

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  private isMaster(user: AuthenticatedUser): boolean {
    return user.role?.name.toLowerCase() === 'master';
  }

  private hasPermission(user: AuthenticatedUser, permission: string): boolean {
    if (this.isMaster(user)) {
      return true;
    }

    return (
      user.role?.permissions.some((item) => item.name === permission) ?? false
    );
  }

  private canManageTargetUser(user: AuthenticatedUser, identifier: string): boolean {
    return this.hasPermission(user, 'users.update') || String(user.sub) === identifier;
  }

  @Get()
  @RequirePermissions('users.read')
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse[]> {
    return this.userService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('users.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponse> {
    return this.userService.findOne(id, user.tenantId);
  }

  @Post()
  @RequirePermissions('users.create')
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponse> {
    return this.userService.create(createUserDto, user.tenantId, {
      allowMasterRole: this.isMaster(user),
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponse> {
    if (!this.isMaster(user)) {
      delete updateUserDto.suspended;
    }

    if (!this.hasPermission(user, 'users.update')) {
      if (String(user.sub) !== id) {
        throw new ForbiddenException('User does not have permission.');
      }

      delete updateUserDto.roleId;
      delete updateUserDto.password;
    }

    if (!this.hasPermission(user, 'user.email')) {
      delete updateUserDto.email;
    }

    return this.userService.update(id, updateUserDto, user.tenantId, {
      allowMasterRole: this.isMaster(user),
    });
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: UploadedImageFile,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponse> {
    if (!this.canManageTargetUser(user, id)) {
      throw new ForbiddenException('User does not have permission.');
    }

    return this.userService.uploadPhoto(id, user.tenantId, file);
  }

  @Delete(':id/photo')
  removePhoto(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponse> {
    if (!this.canManageTargetUser(user, id)) {
      throw new ForbiddenException('User does not have permission.');
    }

    return this.userService.removePhoto(id, user.tenantId);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.userService.remove(id, user.tenantId);
  }
}
