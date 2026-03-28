// src/components/ProtectedRoute/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../Loader/Loader';

interface ProtectedRouteProps {
  redirectTo?: string;
}

function ProtectedRoute({ redirectTo = '/' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasCheckedSession } = useAuth();
  const location = useLocation();

  if (isLoading || !hasCheckedSession) {
    return <Loader message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Save the attempted location to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    
    // Redirect to home page (where login modal will be available)
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;