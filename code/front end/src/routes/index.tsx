import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminRouteGuard } from '../components/auth/AdminRouteGuard';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { RegisterPage } from '../pages/Auth/RegisterPage';
import { CreateListingPage } from '../pages/Listing/CreateListingPage';
import { ListingDetailPage } from '../pages/Listing/ListingDetailPage';
import { MyListingsPage } from '../pages/Listing/MyListingsPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';
import { RentalListPage } from '../pages/Rental/RentalListPage';
import { RentalDetailPage } from '../pages/Rental/RentalDetailPage';
import { AdminDashboardPage } from '../pages/Admin/AdminDashboardPage';
import { AdminLoginPage } from '../pages/Admin/AdminLoginPage';
import { ChatPage } from '../pages/Chat/ChatPage';

export const router = createBrowserRouter([
  // 1. Phân hệ Khách hàng / Sinh viên (Customer Marketplace)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'listings/:id',
        element: <ListingDetailPage />,
      },
      {
        path: 'create-listing',
        element: <CreateListingPage />,
      },
      {
        path: 'my-listings',
        element: <MyListingsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'rentals',
        element: <RentalListPage />,
      },
      {
        path: 'rentals/:id',
        element: <RentalDetailPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
    ],
  },

  // 2. Phân hệ Xác thực Sinh viên (Auth Layout)
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
    ],
  },

  // 3. Cổng Đăng nhập Quản trị viên Riêng biệt
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },

  // 4. Phân hệ Quản trị viên Độc lập (Admin Portal)
  {
    path: '/admin',
    element: (
      <AdminRouteGuard>
        <AdminLayout />
      </AdminRouteGuard>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'listings',
        element: <AdminDashboardPage />,
      },
      {
        path: 'users',
        element: <AdminDashboardPage />,
      },
      {
        path: 'reports',
        element: <AdminDashboardPage />,
      },
      {
        path: 'metadata',
        element: <AdminDashboardPage />,
      },
      {
        path: 'settings',
        element: <AdminDashboardPage />,
      },
      {
        path: 'moderation',
        element: <AdminDashboardPage />,
      },
    ],
  },

  // 5. Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
