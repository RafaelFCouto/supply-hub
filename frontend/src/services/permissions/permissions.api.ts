import { apiRequest } from '../api';
import type { ApiMessageResponse, CreatePermissionPayload, Permission, UpdatePermissionPayload } from './permissions.types';

export function listPermissionsRequest() {
  return apiRequest<ApiMessageResponse<Permission[]>>('/permissions');
}

export function createPermissionRequest(payload: CreatePermissionPayload) {
  return apiRequest<ApiMessageResponse<Permission>>('/permissions', {
    method: 'POST',
    body: payload,
  });
}

export function updatePermissionRequest(permissionId: number, payload: UpdatePermissionPayload) {
  return apiRequest<ApiMessageResponse<Permission>>(`/permissions/${permissionId}`, {
    method: 'PATCH',
    body: payload,
  });
}
