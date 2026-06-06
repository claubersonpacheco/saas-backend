import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PLAN_MODULES_KEY = 'requiredPlanModules';

export const RequirePlanModules = (...modules: string[]) =>
  SetMetadata(REQUIRED_PLAN_MODULES_KEY, modules);
