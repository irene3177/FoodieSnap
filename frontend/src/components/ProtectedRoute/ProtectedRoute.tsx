// src/components/ProtectedRoute/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import OverlayLoader from '../Loader/OverlayLoader';

interface ProtectedRouteProps {
  redirectTo?: string;
}

function ProtectedRoute({ redirectTo = '/' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasCheckedSession } = useAuth();
  const location = useLocation();

  if (isLoading || !hasCheckedSession) {
    return (
      <>
        <div className="protected-content">
          <Outlet />
        </div>
        <OverlayLoader message="Checking authentication..." />
      </>
    );
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