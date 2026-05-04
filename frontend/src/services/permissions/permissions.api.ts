import { apiRequest } from '../api';
import type { ApiMessageResponse, CreatePermissionPayload, Permission } from './permissions.types';

export function listPermissionsRequest() {
  return apiRequest<ApiMessageResponse<Permission[]>>('/permissions');
}

export function createPermissionRequest(payload: CreatePermissionPayload) {
  return apiRequest<ApiMessageResponse<Permission>>('/permissions', {
    method: 'POST',
    body: payload,
  });
}
