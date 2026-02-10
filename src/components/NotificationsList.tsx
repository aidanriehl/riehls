import { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'signup';
  actorName: string;
  actorAvatar: string;
  message: string;
  videoThumbnail: string | null;
  createdAt: string;
  isRead: boolean;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

export function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch notifications for the current user (as admin, they see activity on their videos)
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          message,
          created_at,
          is_read,
          actor:profiles!notifications_actor_id_fkey(display_name, avatar_url, username),
          video:videos!notifications_video_id_fkey(thumbnail_url)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const mapped: NotificationData[] = data.map((n: any) => {
          let message = '';
          if (n.type === 'like') {
            message = 'liked your video';
          } else if (n.type === 'comment') {
            message = `commented: "${n.message?.slice(0, 30) || '...'}"`;
          } else if (n.type === 'signup') {
            message = n.message || 'joined riehls';
          }
          
          return {
            id: n.id,
            type: n.type as 'like' | 'comment' | 'signup',
            actorName: n.actor?.display_name || n.actor?.username || 'Someone',
            actorAvatar: n.actor?.avatar_url || '/placeholder.svg',
            message,
            videoThumbnail: n.video?.thumbnail_url || null,
            createdAt: n.created_at,
            isRead: n.is_read,
          };
        });
        setNotifications(mapped);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No activity yet</h3>
        <p className="text-muted-foreground text-sm">
          When people interact with your videos, you'll see it here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'flex items-center gap-3 p-4 transition-colors',
            !notification.isRead && 'bg-secondary/50'
          )}
        >
          {/* Avatar with icon badge */}
          <div className="relative flex-shrink-0">
            <UserAvatar
              src={notification.actorAvatar === '/placeholder.svg' ? null : notification.actorAvatar}
              name={notification.actorName}
              className="w-11 h-11"
            />
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center",
                notification.type === 'signup' ? 'bg-primary' : 'bg-like'
              )}
            >
              {notification.type === 'like' ? (
                <Heart className="w-2.5 h-2.5 fill-foreground text-foreground" />
              ) : notification.type === 'comment' ? (
                <MessageCircle className="w-2.5 h-2.5 text-foreground" />
              ) : (
                <UserPlus className="w-2.5 h-2.5 text-foreground" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{notification.actorName}</span>{' '}
              <span className="text-muted-foreground">{notification.message}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>

          {/* Video thumbnail */}
          {notification.videoThumbnail && (
            <img
              src={notification.videoThumbnail}
              alt=""
              className="w-11 h-11 rounded object-cover flex-shrink-0"
            />
          )}
        </div>
      ))}
    </div>
  );
}
