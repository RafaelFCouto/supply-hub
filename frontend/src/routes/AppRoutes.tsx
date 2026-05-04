import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { TenantsPage } from '../pages/TenantsPage';
import { ProtectedRoute, getStoredAccessToken } from '../services/auth';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/tenants" element={<TenantsPage />} />
      </Route>
      <Route path="/" element={<Navigate to={getStoredAccessToken() ? '/home' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={getStoredAccessToken() ? '/home' : '/login'} replace />} />
    </Routes>
  );
}
