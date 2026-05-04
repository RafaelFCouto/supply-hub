import {
  createTenantRequest,
  deactivateTenantRequest,
  listTenantsRequest,
  updateTenantRequest,
  updateTenantStatusRequest,
} from './tenants.api';
import type { CreateTenantPayload, UpdateTenantPayload, UpdateTenantStatusPayload } from './tenants.types';

export function listTenants() {
  return listTenantsRequest();
}

export function createTenant(payload: CreateTenantPayload) {
  return createTenantRequest(payload);
}

export function updateTenant(tenantId: number, payload: UpdateTenantPayload) {
  return updateTenantRequest(tenantId, payload);
}

export function updateTenantStatus(tenantId: number, payload: UpdateTenantStatusPayload) {
  return updateTenantStatusRequest(tenantId, payload);
}

export function deactivateTenant(tenantId: number) {
  return deactivateTenantRequest(tenantId);
}

export type {
  ApiMessageResponse,
  CreateTenantPayload,
  Tenant,
  TenantStatus,
  UpdateTenantPayload,
  UpdateTenantStatusPayload,
} from './tenants.types';
