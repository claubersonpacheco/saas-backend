import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { REQUIRED_PLAN_MODULES_KEY } from '../decorators/require-plan-modules.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class PlanModulesGuard implements CanActivate {
  private normalizeModule(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredModules =
      Reflect.getMetadata(REQUIRED_PLAN_MODULES_KEY, context.getHandler()) ??
      Reflect.getMetadata(REQUIRED_PLAN_MODULES_KEY, context.getClass()) ??
      [];

    if (!requiredModules.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;

    if (user?.role?.name.toLowerCase() === 'master') {
      return true;
    }

    const modules = user?.tenantPlan?.modules ?? [];
    const tenantModules = new Set(
      modules.map((module) => this.normalizeModule(module)),
    );

    const hasModule = requiredModules.some((module) =>
      tenantModules.has(this.normalizeModule(module)),
    );

    if (!hasModule) {
      throw new ForbiddenException('Tenant plan does not allow this module.');
    }

    return true;
  }
}
