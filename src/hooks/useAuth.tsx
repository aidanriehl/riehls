 import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
 import { User, Session } from '@supabase/supabase-js';
 import { supabase } from '@/integrations/supabase/client';
 
 interface AuthContextType {
   user: User | null;
   session: Session | null;
   loading: boolean;
   signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
   signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
   signOut: () => Promise<void>;
   isAdmin: boolean;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [loading, setLoading] = useState(true);
   const [isAdmin, setIsAdmin] = useState(false);
 
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Auto-populate profile from OAuth metadata for new users
          if (event === 'SIGNED_IN') {
            setTimeout(async () => {
              await initializeProfileFromOAuth(session.user);
            }, 0);
          }
          
          // Check admin role
          setTimeout(async () => {
            const { data } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('role', 'admin')
              .maybeSingle();
            
            setIsAdmin(!!data);
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle()
          .then(({ data }) => {
            console.log('Auth: Admin role check result:', data);
            setIsAdmin(!!data);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auto-populate profile from OAuth user metadata
  const initializeProfileFromOAuth = async (user: User) => {
    const metadata = user.user_metadata;
    
    // Extract name - handle both Google and Apple formats
    let displayName: string | null = null;
    if (metadata?.name) {
      displayName = metadata.name;
    } else if (metadata?.full_name) {
      if (typeof metadata.full_name === 'string') {
        displayName = metadata.full_name;
      } else if (metadata.full_name?.firstName) {
        displayName = `${metadata.full_name.firstName} ${metadata.full_name.lastName || ''}`.trim();
      }
    }
    
    // Extract avatar - handle both Google and Apple formats
    const avatarUrl = metadata?.picture || metadata?.avatar_url || null;
    
    // Generate username from name or email
    const baseUsername = displayName?.toLowerCase().replace(/\s+/g, '_') || 
                         user.email?.split('@')[0] || 
                         'user';
    const username = `${baseUsername}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Check if profile already has onboarding complete
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('onboarding_complete, display_name')
      .eq('id', user.id)
      .maybeSingle();
    
    // Only update if onboarding not complete and no display name set
    if (existingProfile && !existingProfile.onboarding_complete && !existingProfile.display_name) {
      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          username: username,
          onboarding_complete: true,
        })
        .eq('id', user.id);
    }
  };
 
   const signUp = async (email: string, password: string) => {
     const { error } = await supabase.auth.signUp({
       email,
       password,
       options: {
         emailRedirectTo: window.location.origin,
       },
     });
     return { error: error as Error | null };
   };
 
   const signIn = async (email: string, password: string) => {
     const { error } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
     return { error: error as Error | null };
   };
 
   const signOut = async () => {
     await supabase.auth.signOut();
   };
 
   return (
     <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, isAdmin }}>
       {children}
     </AuthContext.Provider>
   );
 }
 
 export function useAuth() {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
 }