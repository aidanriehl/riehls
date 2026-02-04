import { Heart, MessageCircle } from 'lucide-react';
import { Notification } from '@/types';
import { mockNotifications } from '@/data/mockData';
import { cn } from '@/lib/utils';

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
  if (mockNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No notifications yet</h3>
        <p className="text-muted-foreground text-sm">
          When people interact with your videos, you'll see it here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {mockNotifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'flex items-center gap-3 p-4 transition-colors',
            !notification.isRead && 'bg-secondary/50'
          )}
        >
          {/* Avatar with icon badge */}
          <div className="relative flex-shrink-0">
            <img
              src={notification.avatarUrl}
              alt={notification.username}
              className="w-11 h-11 rounded-full"
            />
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center',
                notification.type === 'like' ? 'bg-like' : 'bg-primary'
              )}
            >
              {notification.type === 'like' ? (
                <Heart className="w-2.5 h-2.5 fill-foreground text-foreground" />
              ) : (
                <MessageCircle className="w-2.5 h-2.5 text-foreground" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{notification.username}</span>{' '}
              <span className="text-muted-foreground">{notification.message}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>

          {/* Video thumbnail */}
          <img
            src={notification.videoThumbnail}
            alt=""
            className="w-11 h-11 rounded object-cover flex-shrink-0"
          />
        </div>
      ))}
    </div>
  );
}
