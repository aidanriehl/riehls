import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UnfollowDialog } from '@/components/UnfollowDialog';
import { mockVideos } from '@/data/mockData';

const CreatorProfile = () => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(true);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);

  const handleFollowClick = () => {
    if (isFollowing) {
      setShowUnfollowDialog(true);
    } else {
      setIsFollowing(true);
    }
  };

  const postCount = mockVideos.length;

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
          <Avatar className="w-20 h-20">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>

          <div className="flex flex-1 justify-around">
            <div className="text-center">
              <div className="font-semibold">{postCount}</div>
              <div className="text-sm text-muted-foreground">posts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">12.4K</div>
              <div className="text-sm text-muted-foreground">followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">342</div>
              <div className="text-sm text-muted-foreground">following</div>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mt-4">
          <h1 className="font-semibold">Aidan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Creating moments worth sharing ✨
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
        {mockVideos.map((video) => (
          <div 
            key={video.id} 
            className="aspect-square bg-muted cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              src={video.thumbnailUrl} 
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
