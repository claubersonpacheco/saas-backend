import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'super-secret-key'),
    });
  }

  async validate(payload: AuthenticatedUser): Promise<AuthenticatedUser> {
    const user = await this.userService.findOne(payload.sub, payload.tenantId);

    if (!user) {
      throw new UnauthorizedException('Invalid token.');
    }

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
}
