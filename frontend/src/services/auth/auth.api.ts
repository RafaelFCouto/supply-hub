import { apiRequest } from '../api';
import type { LoginPayload, LoginResponse } from './auth.types';

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}
