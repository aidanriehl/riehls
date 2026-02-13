import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid3X3, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnfollowDialog } from '@/components/UnfollowDialog';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

interface CreatorVideo {
  id: string;
  thumbnailUrl: string | null;
  isPinned: boolean;
}

const CreatorProfile = () => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(true);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const { profile: adminProfile, loading: profileLoading } = useProfile();
  const { isAdmin } = useAuth();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<{
    displayName: string;
    avatarUrl: string;
    bio: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorData = async () => {
      // Use security definer function to get admin user ID (bypasses RLS)
      const { data: fetchedAdminUserId } = await supabase.rpc('get_admin_user_id');
      
      if (!fetchedAdminUserId) {
        setLoading(false);
        return;
      }

      setAdminUserId(fetchedAdminUserId);

      // Fetch admin's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, bio')
        .eq('id', fetchedAdminUserId)
        .maybeSingle();

      if (profileData) {
        setCreatorProfile({
          displayName: profileData.display_name || 'Aidan',
          avatarUrl: profileData.avatar_url || '/placeholder.svg',
          bio: profileData.bio || 'Creating moments worth sharing ✨',
        });
      }

      // Fetch admin's videos
      const { data: videosData } = await supabase
        .from('videos')
        .select('id, thumbnail_url, is_pinned')
        .eq('creator_id', fetchedAdminUserId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (videosData) {
        const mapped = videosData.map(v => ({
          id: v.id,
          thumbnailUrl: v.thumbnail_url,
          isPinned: v.is_pinned ?? false,
        }));
        mapped.sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
        setVideos(mapped);
      }
      
      setLoading(false);
    };

    if (!profileLoading) {
      fetchCreatorData();
    }
  }, [profileLoading]);

  const handleFollowClick = () => {
    if (isFollowing) {
      setShowUnfollowDialog(true);
    } else {
      setIsFollowing(true);
    }
  };

  const isLoading = loading || profileLoading;

  // Use username from profile, fallback to display_name, fallback to 'aidan'
  const headerUsername = isAdmin && adminProfile?.username 
    ? adminProfile.username 
    : creatorProfile?.displayName?.toLowerCase().replace(/\s+/g, '') || 'aidan';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center h-14 px-4 border-b border-border bg-background">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Profile Info */}
      <div className="px-4 py-6">
        {/* Avatar and Stats Row */}
        <div className="flex items-center gap-8">
          <UserAvatar
            src={creatorProfile?.avatarUrl === '/placeholder.svg' ? null : creatorProfile?.avatarUrl}
            name={creatorProfile?.displayName}
            className="w-20 h-20"
          />

          <div className="flex flex-1 justify-around">
            <div className="text-center">
              <div className="font-semibold">{videos.length}</div>
              <div className="text-sm text-muted-foreground">posts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">802</div>
              <div className="text-sm text-muted-foreground">credit score</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">225</div>
              <div className="text-sm text-muted-foreground">bench press</div>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mt-4">
          <h1 className="font-semibold">{creatorProfile?.displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {creatorProfile?.bio}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant={isFollowing ? "secondary" : "default"}
            className="flex-1"
            onClick={handleFollowClick}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1"
            onClick={() => navigate('/messages', { state: { recipientId: adminUserId } })}
          >
            Message
          </Button>
        </div>
      </div>

      {/* Posts Grid Header */}
      <div className="border-t border-border">
        <div className="flex justify-center py-3">
          <Grid3X3 className="w-6 h-6" />
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="aspect-square bg-muted cursor-pointer relative"
            onClick={() => navigate(`/?video=${video.id}`, { state: { fromCreatorProfile: true } })}
          >
            <img 
              src={video.thumbnailUrl || '/placeholder.svg'} 
              alt="" 
              className="w-full h-full object-cover"
            />
            {video.isPinned && (
              <div className="absolute top-1.5 right-1.5">
                <Pin className="w-4 h-4 text-white drop-shadow-md fill-white rotate-45" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Unfollow Dialog */}
      <UnfollowDialog 
        open={showUnfollowDialog}
        onOpenChange={setShowUnfollowDialog}
      />
    </div>
  );
};

export default CreatorProfile;
