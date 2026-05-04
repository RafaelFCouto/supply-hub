import { apiRequest } from '../api';
import type { ApiMessageResponse, CreateRolePayload, Role, UpdateRolePayload } from './roles.types';

export function listRolesRequest(tenantId: number) {
  return apiRequest<ApiMessageResponse<Role[]>>(`/tenants/${tenantId}/roles`);
}

export function createRoleRequest(tenantId: number, payload: CreateRolePayload) {
  return apiRequest<ApiMessageResponse<Role>>(`/tenants/${tenantId}/roles`, {
    method: 'POST',
    body: payload,
  });
}

export function updateRoleRequest(tenantId: number, roleId: number, payload: UpdateRolePayload) {
  return apiRequest<ApiMessageResponse<Role>>(`/tenants/${tenantId}/roles/${roleId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deactivateRoleRequest(tenantId: number, roleId: number) {
  return apiRequest<ApiMessageResponse<Role>>(`/tenants/${tenantId}/roles/${roleId}`, {
    method: 'DELETE',
  });
}
