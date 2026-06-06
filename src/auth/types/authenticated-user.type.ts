export type AuthenticatedUser = {
  sub: number;
  tenantId: number;
  tenantSlug: string;
  email: string;
  name: string;
  tenantPlan: {
    id: number;
    name: string;
    slug: string;
    projectType: string;
    modules: string[];
  } | null;
  role: {
    id: number;
    name: string;
    permissions: {
      id: number;
      name: string;
    }[];
  } | null;
};
