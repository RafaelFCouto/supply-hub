export interface AuthUser {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  roleIds: number[];
}
