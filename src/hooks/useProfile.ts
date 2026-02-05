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
 
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    console.log('Upload: Getting session...');

    // Get session with timeout to prevent hanging
    let session;
    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session fetch timed out')), 5000)
      );
      const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: any } };
      session = result.data.session;
    } catch (err) {
      console.error('Session fetch failed:', err);
      return { error: new Error('Could not verify session. Please refresh and try again.'), url: null };
    }

    if (!session?.access_token) {
      console.error('No valid session for upload');
      return { error: new Error('Please sign in again to upload'), url: null };
    }
 
    console.log('Upload: Session verified, uploading to:', filePath);
 
    try {
      // Use direct fetch instead of SDK (bypasses internal auth sync issues)
      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/avatars/${filePath}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-upsert': 'true',
          },
          body: file,
        }
      );
 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload failed:', response.status, errorData);
        return { 
          error: new Error(errorData.message || `Upload failed: ${response.status}`), 
          url: null 
        };
      }
 
      console.log('Upload successful, getting public URL');
 
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
 
      console.log('Public URL:', publicUrl);
 
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