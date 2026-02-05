 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 
 export interface Profile {
   id: string;
   username: string | null;
   display_name: string | null;
   avatar_url: string | null;
   bio: string | null;
   onboarding_complete: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export function useProfile() {
   const { user } = useAuth();
   const [profile, setProfile] = useState<Profile | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
    let isMounted = true;
 
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
 
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
 
        if (isMounted) {
          if (error) {
            console.error('Error fetching profile:', error);
          }
          setProfile(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Profile fetch error:', err);
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  };
 
   const updateProfile = async (updates: Partial<Profile>) => {
     if (!user) return { error: new Error('Not authenticated') };
 
     const { error } = await supabase
       .from('profiles')
       .update(updates)
       .eq('id', user.id);
 
     if (!error) {
       await fetchProfile();
     }
 
     return { error };
   };
 
   const uploadAvatar = async (file: File) => {
     if (!user) return { error: new Error('Not authenticated'), url: null };
 
     const fileExt = file.name.split('.').pop();
     const filePath = `${user.id}/avatar.${fileExt}`;
 
     const { error: uploadError } = await supabase.storage
       .from('avatars')
       .upload(filePath, file, { upsert: true });
 
     if (uploadError) {
       return { error: uploadError, url: null };
     }
 
     const { data: { publicUrl } } = supabase.storage
       .from('avatars')
       .getPublicUrl(filePath);
 
     // Update profile with new avatar URL
     await updateProfile({ avatar_url: publicUrl });
 
     return { error: null, url: publicUrl };
   };
 
   return {
     profile,
     loading,
     updateProfile,
     uploadAvatar,
     refetch: fetchProfile,
   };
 }