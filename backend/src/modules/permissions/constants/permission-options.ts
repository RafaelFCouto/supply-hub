export const PERMISSION_RESOURCES = [
  'tenants',
  'permissions',
  'roles',
  'users',
  'products',
  'suppliers',
  'materials',
  'reports',
] as const;

export const PERMISSION_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
