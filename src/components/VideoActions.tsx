import { Heart, MessageCircle, DollarSign, Send } from 'lucide-react';
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

export function VideoActions({ video, onLike, onComment, onSave, onShare }: VideoActionsProps) {
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
        <span className="text-xs font-medium">{formatCount(video.likeCount)}</span>
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
      </div>

      <TipCountdownDialog 
        open={showTipDialog} 
        onOpenChange={setShowTipDialog} 
      />
    </>
  );
}
