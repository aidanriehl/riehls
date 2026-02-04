import { Heart, MessageCircle, Bookmark, Send } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  const [saveAnimating, setSaveAnimating] = useState(false);

  const handleLike = () => {
    setLikeAnimating(true);
    onLike();
    setTimeout(() => setLikeAnimating(false), 300);
  };

  const handleSave = () => {
    setSaveAnimating(true);
    onSave();
    setTimeout(() => setSaveAnimating(false), 300);
  };

  return (
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

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div
          className={cn(
            'p-2 rounded-full transition-all',
            saveAnimating && 'like-animate'
          )}
        >
          <Bookmark
            className={cn(
              'w-7 h-7 transition-all',
              video.isSaved ? 'fill-save text-save' : 'text-foreground'
            )}
          />
        </div>
        <span className="text-xs font-medium">Save</span>
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
  );
}
