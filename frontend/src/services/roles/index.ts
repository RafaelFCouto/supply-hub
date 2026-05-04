import {
  createRoleRequest,
  deactivateRoleRequest,
  listRolesRequest,
  updateRoleRequest,
} from './roles.api';
import type { ApiMessageResponse, CreateRolePayload, Role, RoleStatus, UpdateRolePayload } from './roles.types';

export async function listRoles(tenantId: number): Promise<ApiMessageResponse<Role[]>> {
  return listRolesRequest(tenantId);
}

export async function createRole(tenantId: number, payload: CreateRolePayload): Promise<ApiMessageResponse<Role>> {
  return createRoleRequest(tenantId, payload);
}

export async function updateRole(
  tenantId: number,
  roleId: number,
  payload: UpdateRolePayload,
): Promise<ApiMessageResponse<Role>> {
  return updateRoleRequest(tenantId, roleId, payload);
}

export async function deactivateRole(tenantId: number, roleId: number): Promise<ApiMessageResponse<Role>> {
  return deactivateRoleRequest(tenantId, roleId);
}

export type { ApiMessageResponse, CreateRolePayload, Role, RoleStatus, UpdateRolePayload };
