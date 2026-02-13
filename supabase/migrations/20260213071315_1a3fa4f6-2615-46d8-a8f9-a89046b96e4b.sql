-- Create trigger to notify video creator when someone likes their video
CREATE OR REPLACE FUNCTION public.notify_on_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  video_creator_id uuid;
BEGIN
  -- Get the creator of the video being liked
  SELECT creator_id INTO video_creator_id FROM public.videos WHERE id = NEW.video_id;
  
  -- Insert notification if creator exists and isn't liking their own video
  IF video_creator_id IS NOT NULL AND video_creator_id != NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, video_id)
    VALUES (
      video_creator_id,
      NEW.user_id,
      'like',
      NEW.video_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to notify video creator when someone comments on their video
CREATE OR REPLACE FUNCTION public.notify_on_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  video_creator_id uuid;
BEGIN
  -- Get the creator of the video being commented on
  SELECT creator_id INTO video_creator_id FROM public.videos WHERE id = NEW.video_id;
  
  -- Insert notification if creator exists and isn't commenting on their own video
  IF video_creator_id IS NOT NULL AND video_creator_id != NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, message, video_id)
    VALUES (
      video_creator_id,
      NEW.user_id,
      'comment',
      NEW.text,
      NEW.video_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create triggers for likes and comments
DROP TRIGGER IF EXISTS trigger_notify_on_like ON public.likes;
CREATE TRIGGER trigger_notify_on_like
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_like();

DROP TRIGGER IF EXISTS trigger_notify_on_comment ON public.comments;
CREATE TRIGGER trigger_notify_on_comment
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();