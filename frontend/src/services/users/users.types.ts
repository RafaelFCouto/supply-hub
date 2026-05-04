import type { Role } from '../roles';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type UserRole = {
  userId: number;
  roleId: number;
  assignedAt: string;
  role: Role;
};

export type User = {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  status: UserStatus;
  userRoles: UserRole[];
  createdAt: string;
  updatedAt: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  status: UserStatus;
  roleIds: number[];
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  status?: UserStatus;
  roleIds?: number[];
};

export type ApiMessageResponse<T> = {
  data: T;
  message: string;
};
