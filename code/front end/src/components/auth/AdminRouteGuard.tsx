import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';

interface AdminRouteGuardProps {
  children?: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { isAdminAuthenticated, adminUser } = useAdminAuthStore();
  const location = useLocation();

  if (!isAdminAuthenticated || !adminUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const role = adminUser.role as string;
  const isAdmin =
    role === 'ROLE_SUPER_ADMIN' ||
    role === 'ROLE_MODERATOR' ||
    role === 'ROLE_ADMIN';

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ error: 'Tài khoản không có quyền truy cập Cổng Quản trị' }} replace />;
  }

  return children ? <>{children}</> : null;
};
