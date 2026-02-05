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

   const updateProfile = async (updates: Partial<Profile>) => {
     if (!user) return { error: new Error('Not authenticated') };
 
    try {
      console.log('Updating profile with:', updates);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
 
      if (error) {
        console.error('Profile update error:', error);
        return { error };
      }
 
      // Refetch profile after successful update
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error refetching profile:', fetchError);
      } else {
        setProfile(updatedProfile);
      }

      console.log('Profile updated successfully');
      return { error: null };
    } catch (err) {
      console.error('Update profile error:', err);
      return { error: err as Error };
    }
   };
 
   const uploadAvatar = async (file: File) => {
     if (!user) return { error: new Error('Not authenticated'), url: null };
 
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
 
      console.log('Uploading avatar to:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
 
      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return { error: uploadError, url: null };
      }
 
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
 
      console.log('Avatar uploaded, public URL:', publicUrl);
 
      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      
      if (updateError) {
        console.error('Failed to update profile with avatar URL:', updateError);
        // Return success anyway since the file was uploaded
      }

      return { error: null, url: publicUrl };
    } catch (err) {
      console.error('Avatar upload exception:', err);
      return { error: err as Error, url: null };
    }
   };
 
   return {
     profile,
     loading,
     updateProfile,
     uploadAvatar,
    refetch: async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) setProfile(data);
    },
   };
 }