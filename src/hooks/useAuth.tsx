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
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // CRITICAL: Use setTimeout to avoid Supabase SDK deadlock
          // See: https://supabase.com/docs/guides/troubleshooting/why-is-my-supabase-api-call-not-returning
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