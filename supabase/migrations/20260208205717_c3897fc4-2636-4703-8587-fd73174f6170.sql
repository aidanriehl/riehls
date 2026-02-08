-- Add 'signup' to the notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'signup';

-- Make video_id nullable since signup notifications don't have a video
ALTER TABLE public.notifications ALTER COLUMN video_id DROP NOT NULL;

-- Create trigger function to notify admin on new user signup
CREATE OR REPLACE FUNCTION public.notify_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the admin user id
  admin_user_id := public.get_admin_user_id();
  
  -- Only create notification if admin exists and new user is not the admin
  IF admin_user_id IS NOT NULL AND NEW.id != admin_user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, message)
    VALUES (
      admin_user_id,
      NEW.id,
      'signup',
      'joined riehls'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table for new signups
DROP TRIGGER IF EXISTS on_profile_created_notify_admin ON public.profiles;
CREATE TRIGGER on_profile_created_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_signup();