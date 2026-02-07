import { useState, useEffect } from 'react';
import { Settings, Heart, Bell, Grid3X3 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { LikedVideos } from '@/components/LikedVideos';
import { NotificationsList } from '@/components/NotificationsList';
import { ProfileSettingsSheet } from '@/components/ProfileSettingsSheet';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type Tab = 'posts' | 'notifications' | 'liked';

const DEFAULT_TAB: Tab = 'posts';

interface MyVideo {
  id: string;
  thumbnailUrl: string | null;
  likeCount: number;
  commentCount: number;
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState<Tab>(DEFAULT_TAB);
  const { getLikedVideos } = useVideos();
  const likedVideos = getLikedVideos();
  const [showSettings, setShowSettings] = useState(false);
  const { profile, loading: profileLoading } = useProfile();
  const { user, isAdmin } = useAuth();
  const [myVideos, setMyVideos] = useState<MyVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  // Fetch user's own videos
  useEffect(() => {
    const fetchMyVideos = async () => {
      if (!user) {
        setVideosLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('videos')
        .select('id, thumbnail_url, like_count, comment_count')
        .eq('creator_id', user.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setMyVideos(data.map(v => ({
          id: v.id,
          thumbnailUrl: v.thumbnail_url,
          likeCount: v.like_count,
          commentCount: v.comment_count,
        })));
      }
      setVideosLoading(false);
    };

    fetchMyVideos();
  }, [user]);

  const handleProfileSave = () => {
    // Profile updates are handled by the settings sheet
  };

  const displayName = profile?.display_name || 'User';
  const avatarUrl = profile?.avatar_url || '/placeholder.svg';
  const bio = profile?.bio || '';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - minimal, no border */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-end px-4 h-11">
          <button className="p-2 -mr-2" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Profile info - reduced top padding */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-muted-foreground text-sm mt-1">{bio}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors',
            activeTab === 'posts'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground'
          )}
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors',
            activeTab === 'notifications'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground'
          )}
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors',
            activeTab === 'liked'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground'
          )}
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === 'posts' ? (
          videosLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          ) : myVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Grid3X3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No posts yet</h3>
              <p className="text-muted-foreground text-sm">
                Your videos will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {myVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="aspect-square bg-muted relative"
                >
                  <img 
                    src={video.thumbnailUrl || '/placeholder.svg'} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  {/* Admin overlay with counts */}
                  {isAdmin && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex justify-between text-white text-xs font-medium">
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3 fill-current" />
                        {video.likeCount}
                      </span>
                      <span>{video.commentCount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'liked' ? (
          <LikedVideos videos={likedVideos} />
        ) : (
          <NotificationsList />
        )}
      </div>

      {/* Settings Sheet */}
      <ProfileSettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        currentProfile={{
          avatarUrl,
          displayName,
          bio,
        }}
        onSave={handleProfileSave}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;
