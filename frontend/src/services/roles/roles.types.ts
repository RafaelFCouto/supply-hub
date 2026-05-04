import type { Permission } from '../permissions';

export type RoleStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type RolePermission = {
  roleId: number;
  permissionId: number;
  assignedAt: string;
  permission: Permission;
};

export type Role = {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  status: RoleStatus;
  rolePermissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
};

export type CreateRolePayload = {
  name: string;
  description?: string;
  status: RoleStatus;
  permissionIds: number[];
};

export type UpdateRolePayload = {
  name?: string;
  description?: string;
  status?: RoleStatus;
  permissionIds?: number[];
};

export type ApiMessageResponse<T> = {
  data: T;
  message: string;
};
