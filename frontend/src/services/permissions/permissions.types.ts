import type { PermissionAction, PermissionResource } from './permissions.constants';

export type Permission = {
  id: number;
  resource: PermissionResource;
  action: PermissionAction;
  createdAt: string;
  updatedAt: string;
};

export type CreatePermissionPayload = {
  resource: PermissionResource;
  action: PermissionAction;
};

export type ApiMessageResponse<T> = {
  data: T;
  message: string;
};

export type { PermissionAction, PermissionResource };
