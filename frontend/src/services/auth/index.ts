import { loginRequest } from './auth.api';
import { AuthProvider, useAuth } from './auth.context';
import { ProtectedRoute } from './auth.guard';
import { getAuthSession, hasAnyRole } from './auth.session';
import { storeAccessToken, getStoredAccessToken, clearStoredAccessToken } from './auth.storage';
import type { AuthSession, JwtPayload, LoginPayload, LoginResponse } from './auth.types';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await loginRequest(payload);

  storeAccessToken(response.data.accessToken);

  return response;
}

export { AuthProvider, ProtectedRoute, clearStoredAccessToken, getAuthSession, getStoredAccessToken, hasAnyRole, useAuth };
export type { AuthSession, JwtPayload, LoginPayload, LoginResponse };
