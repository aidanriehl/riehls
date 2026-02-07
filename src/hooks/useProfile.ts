import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Convert any image to JPEG for maximum compatibility (handles HEIC, PNG, WebP, etc.)
const convertToJpeg = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Clean up
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image to JPEG'));
        },
        'image/jpeg',
        0.9 // 90% quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for conversion'));
    };
    
    img.src = objectUrl;
  });
};

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
        console.error('Profile fetch error:', err);
        if (isMounted) {
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

      return { error: null };
    } catch (err) {
      console.error('Update profile error:', err);
      return { error: err as Error };
    }
  };
 
  const uploadAvatar = async (file: File, accessToken?: string) => {
    if (!user) return { error: new Error('Not authenticated'), url: null };
    if (!accessToken) return { error: new Error('No access token'), url: null };

    const filePath = `${user.id}/avatar.jpg`;

    try {
      const jpegBlob = await convertToJpeg(file);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${filePath}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: jpegBlob,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { error: new Error(errorText), url: null };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });

      return { error: null, url: publicUrl };
    } catch (err) {
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