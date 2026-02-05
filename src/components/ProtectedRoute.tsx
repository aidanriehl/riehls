 import { Navigate, useLocation } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 import { useProfile } from '@/hooks/useProfile';
 
 interface ProtectedRouteProps {
   children: React.ReactNode;
   requireOnboarding?: boolean;
   requireAdmin?: boolean;
 }
 
 export function ProtectedRoute({ 
   children, 
   requireOnboarding = true,
   requireAdmin = false 
 }: ProtectedRouteProps) {
   const { user, loading: authLoading, isAdmin } = useAuth();
   const { profile, loading: profileLoading } = useProfile();
   const location = useLocation();
 
   if (authLoading || profileLoading) {
     return (
       <div className="h-screen w-full flex items-center justify-center bg-background">
         <div className="animate-pulse text-muted-foreground">Loading...</div>
       </div>
     );
   }
 
   if (!user) {
     return <Navigate to="/auth" state={{ from: location }} replace />;
   }
 
   if (requireAdmin && !isAdmin) {
     return <Navigate to="/" replace />;
   }
 
   if (requireOnboarding && profile && !profile.onboarding_complete) {
     return <Navigate to="/onboarding" replace />;
   }
 
   return <>{children}</>;
 }