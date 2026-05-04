import { apiRequest } from '../api';
import type { ApiMessageResponse, CreateUserPayload, UpdateUserPayload, User } from './users.types';

export function listUsersRequest(tenantId: number) {
  return apiRequest<ApiMessageResponse<User[]>>(`/tenants/${tenantId}/users`);
}

export function createUserRequest(tenantId: number, payload: CreateUserPayload) {
  return apiRequest<ApiMessageResponse<User>>(`/tenants/${tenantId}/users`, {
    method: 'POST',
    body: payload,
  });
}

export function updateUserRequest(tenantId: number, userId: number, payload: UpdateUserPayload) {
  return apiRequest<ApiMessageResponse<User>>(`/tenants/${tenantId}/users/${userId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deactivateUserRequest(tenantId: number, userId: number) {
  return apiRequest<ApiMessageResponse<User>>(`/tenants/${tenantId}/users/${userId}`, {
    method: 'DELETE',
  });
}
