import { apiRequest } from '../api';
import type {
  ApiMessageResponse,
  CreateTenantPayload,
  Tenant,
  UpdateTenantPayload,
  UpdateTenantStatusPayload,
} from './tenants.types';

export function listTenantsRequest() {
  return apiRequest<ApiMessageResponse<Tenant[]>>('/tenants');
}

export function createTenantRequest(payload: CreateTenantPayload) {
  return apiRequest<ApiMessageResponse<Tenant>>('/tenants', {
    method: 'POST',
    body: payload,
  });
}

export function updateTenantRequest(tenantId: number, payload: UpdateTenantPayload) {
  return apiRequest<ApiMessageResponse<Tenant>>(`/tenants/${tenantId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function updateTenantStatusRequest(tenantId: number, payload: UpdateTenantStatusPayload) {
  return apiRequest<ApiMessageResponse<Tenant>>(`/tenants/${tenantId}/status`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deactivateTenantRequest(tenantId: number) {
  return apiRequest<ApiMessageResponse<Tenant>>(`/tenants/${tenantId}`, {
    method: 'DELETE',
  });
}
