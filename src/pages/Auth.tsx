import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Auth() {
  const { user, loading, signInAnonymously } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const autoSignIn = async () => {
      if (loading) return;
      
      // If already signed in, redirect appropriately
      if (user) {
        navigate('/', { replace: true });
        return;
      }

      // Auto sign in anonymously
      const { error } = await signInAnonymously();
      if (error) {
        console.error('Anonymous sign-in failed:', error);
      }
      // onAuthStateChange will handle navigation after successful sign-in
    };

    autoSignIn();
  }, [user, loading, signInAnonymously, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-wide">riehls</h1>
        <p className="mt-4 text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
