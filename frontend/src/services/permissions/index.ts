import { createPermissionRequest, listPermissionsRequest } from './permissions.api';
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from './permissions.constants';
import type { ApiMessageResponse, CreatePermissionPayload, Permission } from './permissions.types';

export async function listPermissions(): Promise<ApiMessageResponse<Permission[]>> {
  return listPermissionsRequest();
}

export async function createPermission(payload: CreatePermissionPayload): Promise<ApiMessageResponse<Permission>> {
  return createPermissionRequest(payload);
}

export { PERMISSION_ACTIONS, PERMISSION_RESOURCES };
export type { ApiMessageResponse, CreatePermissionPayload, Permission };
