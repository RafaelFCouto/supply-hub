import { createUserRequest, deactivateUserRequest, listUsersRequest, updateUserRequest } from './users.api';
import type { ApiMessageResponse, CreateUserPayload, UpdateUserPayload, User, UserStatus } from './users.types';

export async function listUsers(tenantId: number): Promise<ApiMessageResponse<User[]>> {
  return listUsersRequest(tenantId);
}

export async function createUser(tenantId: number, payload: CreateUserPayload): Promise<ApiMessageResponse<User>> {
  return createUserRequest(tenantId, payload);
}

export async function updateUser(
  tenantId: number,
  userId: number,
  payload: UpdateUserPayload,
): Promise<ApiMessageResponse<User>> {
  return updateUserRequest(tenantId, userId, payload);
}

export async function deactivateUser(tenantId: number, userId: number): Promise<ApiMessageResponse<User>> {
  return deactivateUserRequest(tenantId, userId);
}

export type { ApiMessageResponse, CreateUserPayload, UpdateUserPayload, User, UserStatus };
