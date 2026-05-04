import { clearStoredAccessToken, getStoredAccessToken } from './auth.storage';
import type { AuthSession, JwtPayload } from './auth.types';

function decodeBase64Url(value: string): string {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
  const paddedValue = normalizedValue.padEnd(normalizedValue.length + paddingLength, '=');

  return atob(paddedValue);
}

export function decodeJwtPayload(accessToken: string): JwtPayload | null {
  try {
    const [, payload] = accessToken.split('.');

    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);

  if (!payload?.sub || !payload.tenantId || !payload.email) {
    clearStoredAccessToken();
    return null;
  }

  return {
    accessToken,
    userId: payload.sub,
    tenantId: payload.tenantId,
    email: payload.email,
    roleIds: payload.roleIds ?? [],
  };
}

export function hasAnyRole(session: AuthSession | null, expectedRoleIds: number[]): boolean {
  if (!session) {
    return false;
  }

  if (expectedRoleIds.length === 0) {
    return true;
  }

  return expectedRoleIds.some((roleId) => session.roleIds.includes(roleId));
}
