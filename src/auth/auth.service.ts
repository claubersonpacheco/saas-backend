import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import {
  UserResponse,
  UserService,
  UserWithPassword,
} from '../user/user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  register(createUserDto: CreateUserDto): Promise<UserResponse> {
    return this.userService.create(createUserDto);
  }

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: UserResponse;
  }> {
    const user = await this.validateUser(
      loginDto.identifier,
      loginDto.password,
      loginDto.tenantSlug,
    );
    const payload = this.buildPayload(user);

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.sanitizeUser(user),
    };
  }

  me(userId: number, tenantId: number): Promise<UserResponse> {
    return this.userService.findOne(userId, tenantId);
  }

  private buildPayload(user: UserWithPassword): AuthenticatedUser {
    return {
      sub: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
      email: user.email,
      name: user.name,
      tenantPlan: user.tenant.plan
        ? {
            id: user.tenant.plan.id,
            name: user.tenant.plan.name,
            slug: user.tenant.plan.slug,
            projectType: user.tenant.plan.projectType,
            modules: user.tenant.plan.modules,
          }
        : null,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            permissions: user.role.permissions.map((permission) => ({
              id: permission.id,
              name: permission.name,
            })),
          }
        : null,
    };
  }

  private async validateUser(
    identifier: string,
    password: string,
    tenantSlug?: string,
  ): Promise<UserWithPassword> {
    const user = await this.userService.findByIdentifierWithPassword(
      identifier,
      tenantSlug,
    );

    if (!user || !user.tenant?.active) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.suspended === '1') {
      throw new UnauthorizedException('User is suspended.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return user;
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1);

    await this.userService.updateResetToken(
      user.id,
      resetToken,
      resetPasswordExpires,
    );

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByResetToken(
      resetPasswordDto.token,
    );

    if (!user || !user.resetPasswordExpires) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    await this.userService.updatePassword(user.id, resetPasswordDto.password);

    await this.userService.updateResetToken(user.id, null, null);

    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password.');
    }

    await this.userService.updatePassword(user.id, changePasswordDto.password);

    return { message: 'Password has been changed successfully.' };
  }

  private sanitizeUser(user: UserWithPassword): UserResponse {
    const { password, ...safeUser } = user;
    void password;

    return safeUser;
  }
}
