import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { PermissionsPage } from '../pages/PermissionsPage';
import { RolesPage } from '../pages/RolesPage';
import { TenantsPage } from '../pages/TenantsPage';
import { UsersPage } from '../pages/UsersPage';
import { ProtectedRoute, getStoredAccessToken } from '../services/auth';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="/" element={<Navigate to={getStoredAccessToken() ? '/home' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={getStoredAccessToken() ? '/home' : '/login'} replace />} />
    </Routes>
  );
}
