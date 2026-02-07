import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnfollowDialog } from '@/components/UnfollowDialog';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

interface CreatorVideo {
  id: string;
  thumbnailUrl: string | null;
}

const CreatorProfile = () => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(true);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const { profile: adminProfile, loading: profileLoading } = useProfile();
  const { isAdmin } = useAuth();
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<{
    displayName: string;
    avatarUrl: string;
    bio: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorData = async () => {
      // If current user is admin, use their profile from useProfile() hook
      if (isAdmin && adminProfile) {
        setCreatorProfile({
          displayName: adminProfile.display_name || 'Aidan',
          avatarUrl: adminProfile.avatar_url || '/placeholder.svg',
          bio: adminProfile.bio || 'Creating moments worth sharing ✨',
        });
      } else {
        // For non-admin visitors, fetch the admin's profile from DB
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')
          .maybeSingle();

        if (adminRole?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, bio')
            .eq('id', adminRole.user_id)
            .maybeSingle();

          if (profileData) {
            setCreatorProfile({
              displayName: profileData.display_name || 'Aidan',
              avatarUrl: profileData.avatar_url || '/placeholder.svg',
              bio: profileData.bio || 'Creating moments worth sharing ✨',
            });
          }
        }
      }

      // Fetch admin's videos
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .maybeSingle();

      if (adminRole?.user_id) {
        const { data: videosData } = await supabase
          .from('videos')
          .select('id, thumbnail_url')
          .eq('creator_id', adminRole.user_id)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (videosData) {
          setVideos(videosData.map(v => ({
            id: v.id,
            thumbnailUrl: v.thumbnail_url,
          })));
        }
      }
      setLoading(false);
    };

    if (!profileLoading) {
      fetchCreatorData();
    }
  }, [isAdmin, adminProfile, profileLoading]);

  const handleFollowClick = () => {
    if (isFollowing) {
      setShowUnfollowDialog(true);
    } else {
      setIsFollowing(true);
    }
  };

  const isLoading = loading || profileLoading;

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
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="flex-1 text-center font-semibold">aidan</span>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Profile Info */}
      <div className="px-4 py-6">
        {/* Avatar and Stats Row */}
        <div className="flex items-center gap-8">
          <img
            src={creatorProfile?.avatarUrl || '/placeholder.svg'}
            alt={creatorProfile?.displayName}
            className="w-20 h-20 rounded-full object-cover"
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
            onClick={() => navigate('/messages')}
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
            className="aspect-square bg-muted cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              src={video.thumbnailUrl || '/placeholder.svg'} 
              alt="" 
              className="w-full h-full object-cover"
            />
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
