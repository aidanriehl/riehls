import { useState, useEffect, forwardRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
}

export const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  function ProtectedRoute(
    { children, requireOnboarding = true, requireAdmin = false },
    ref
  ) {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const location = useLocation();
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setLoadingTimeout(true), 5000);
      return () => clearTimeout(timer);
    }, []);

    if ((authLoading || profileLoading) && !loadingTimeout) {
      return (
        <div ref={ref} className="h-screen w-full flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      );
    }

    // If no user, check for recently authenticated flag before redirecting
    if (!user) {
      const recentlyAuth = localStorage.getItem('recentlyAuthenticated') === 'true';
      if (recentlyAuth) {
        return (
          <div ref={ref} className="h-screen w-full flex items-center justify-center bg-background">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        );
      }
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Admin-only routes
    if (requireAdmin && !isAdmin) {
      return <Navigate to="/" replace />;
    }

    // Check navigation state to bypass stale profile data after onboarding completion
    const justCompletedOnboarding = location.state?.onboardingJustCompleted || localStorage.getItem('onboardingJustCompleted') === 'true';
    
    // Redirect to onboarding if not complete (for non-admin users)
    if (requireOnboarding && profile && !profile.onboarding_complete && !justCompletedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }

    return (
      <div ref={ref} className="contents">
        {children}
      </div>
    );
  }
);
