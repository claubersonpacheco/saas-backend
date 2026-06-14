import { Permission } from './permission.entity';

const MODULE_PERMISSION_PREFIXES: Record<string, string[]> = {
  users: ['users.', 'user.email'],
  roles: ['roles.', 'permissions.read'],
  settings: ['settings.'],
  services: ['services.'],
  budget: [
    'categories.',
    'products.',
    'customers.',
    'budgets.',
    'budget-items.',
    'freelancers.',
    'suppliers.',
    'budget-statuses.',
    'invoices.',
    'emails.',
    'expenses.',
    'entries.',
    'budget-totals.',
    'budget-filters.',
  ],
};

export function normalizePlanModule(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function isGlobalPermission(permissionName: string): boolean {
  return (
    permissionName.startsWith('tenants.') ||
    permissionName.startsWith('plans.') ||
    permissionName === 'permissions.create' ||
    permissionName === 'permissions.update' ||
    permissionName === 'permissions.delete'
  );
}

export function isPermissionAllowedByModules(
  permissionName: string,
  modules: string[],
): boolean {
  const normalizedModules = new Set(modules.map(normalizePlanModule));

  return Object.entries(MODULE_PERMISSION_PREFIXES)
    .filter(([module]) => normalizedModules.has(module))
    .flatMap(([, prefixes]) => prefixes)
    .some((prefix) =>
      prefix.endsWith('.')
        ? permissionName.startsWith(prefix)
        : permissionName === prefix,
    );
}

export function filterPermissionsByPlanModules(
  permissions: Permission[],
  modules: string[],
): Permission[] {
  return permissions.filter(
    (permission) =>
      !isGlobalPermission(permission.name) &&
      isPermissionAllowedByModules(permission.name, modules),
  );
}
