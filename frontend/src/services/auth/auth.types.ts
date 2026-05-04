export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  data: {
    accessToken: string;
  };
  message: string;
};

export type JwtPayload = {
  sub: number;
  email: string;
  tenantId: number;
  roleIds: number[];
  aud?: string | string[];
  exp?: number;
  iat?: number;
  iss?: string;
};

export type AuthSession = {
  accessToken: string;
  userId: number;
  tenantId: number;
  email: string;
  roleIds: number[];
};
