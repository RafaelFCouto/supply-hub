import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { clearStoredAccessToken } from './auth.storage';
import { getAuthSession } from './auth.session';
import type { AuthSession } from './auth.types';

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  refreshSession: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      refreshSession: () => {
        setSession(getAuthSession());
      },
      logout: () => {
        clearStoredAccessToken();
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
