import { AuthProvider } from '../services/auth';
import { AppRoutes } from '../routes/AppRoutes';

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
