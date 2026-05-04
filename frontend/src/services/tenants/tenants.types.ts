export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type Tenant = {
  id: number;
  name: string;
  cnpj: string;
  address: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantPayload = {
  name: string;
  cnpj: string;
  address: string;
  status: Exclude<TenantStatus, 'INACTIVE'> | 'INACTIVE';
};

export type UpdateTenantPayload = {
  name?: string;
  cnpj?: string;
  address?: string;
};

export type UpdateTenantStatusPayload = {
  status: TenantStatus;
};

export type ApiMessageResponse<T> = {
  data: T;
  message: string;
};
