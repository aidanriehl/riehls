import { Heart, MessageCircle, DollarSign, Send, Volume2, VolumeX } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TipCountdownDialog } from './TipCountdownDialog';

interface VideoActionsProps {
  video: Video;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
}

// Generate a consistent boost based on video ID
function generateBoost(videoId: string, createdAt: string): number {
  // Simple hash from video ID for consistent "random" per video
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    const char = videoId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const now = new Date();
  const videoDate = new Date(createdAt);
  const daysDiff = (now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Use absolute value of hash to get positive number
  const seed = Math.abs(hash);
  
  if (daysDiff < 1) {
    // Posted today: 20-40 boost
    return 20 + (seed % 21);
  } else {
    // Posted 1+ days ago: 40-60 boost
    return 40 + (seed % 21);
  }
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}

export function VideoActions({ video, onLike, onComment, onSave, onShare, onToggleMute, isMuted }: VideoActionsProps) {
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [tipAnimating, setTipAnimating] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);

  const handleLike = () => {
    setLikeAnimating(true);
    onLike();
    setTimeout(() => setLikeAnimating(false), 300);
  };

  const handleTip = () => {
    setTipAnimating(true);
    setShowTipDialog(true);
    setTimeout(() => setTipAnimating(false), 300);
  };

  // Calculate boosted like count for display
  const boost = generateBoost(video.id, video.createdAt);
  const displayedLikes = video.likeCount + boost;

  return (
    <>
      <div className="flex flex-col items-center gap-5">
      {/* Like */}
      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div
          className={cn(
            'p-2 rounded-full transition-all',
            likeAnimating && 'like-animate'
          )}
        >
          <Heart
            className={cn(
              'w-7 h-7 transition-all',
              video.isLiked ? 'fill-like text-like' : 'text-foreground'
            )}
          />
        </div>
        <span className="text-xs font-medium">{formatCount(displayedLikes)}</span>
      </button>

      {/* Comment */}
      <button
        onClick={onComment}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div className="p-2 rounded-full">
          <MessageCircle className="w-7 h-7" />
        </div>
        <span className="text-xs font-medium">{formatCount(video.commentCount)}</span>
      </button>

      {/* Tip */}
      <button
        onClick={handleTip}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div
          className={cn(
            'p-2 rounded-full transition-all',
            tipAnimating && 'like-animate'
          )}
        >
          <DollarSign className="w-7 h-7 text-foreground" />
        </div>
        <span className="text-xs font-medium">Tip</span>
      </button>

      {/* Share */}
      <button
        onClick={(e) => { e.stopPropagation(); onShare(); }}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div className="p-2 rounded-full">
          <Send className="w-7 h-7" />
        </div>
        <span className="text-xs font-medium">Share</span>
      </button>

      {/* Mute toggle */}
      {onToggleMute && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <div className="p-2 rounded-full">
            {isMuted ? (
              <VolumeX className="w-7 h-7 text-foreground" />
            ) : (
              <Volume2 className="w-7 h-7 text-foreground" />
            )}
          </div>
          <span className="text-xs font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
      )}
      </div>

      <TipCountdownDialog 
        open={showTipDialog} 
        onOpenChange={setShowTipDialog} 
      />
    </>
  );
}
