import { useState, useMemo } from 'react';
import { Heart, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockComments } from '@/data/mockData';
import { Comment } from '@/types';
import { cn } from '@/lib/utils';

interface CommentsSheetProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
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

// Generate a consistent emoji based on video ID
function getFirstCommentEmoji(videoId: string): string {
  const emojis = ['🔥', '💯', '🕴️', '🤭'];
  const hash = Math.abs(videoId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
  return emojis[hash % emojis.length];
}

export function CommentsSheet({ videoId, isOpen, onClose }: CommentsSheetProps) {
  // Create the fake first comment
  const fakeFirstComment: Comment = useMemo(() => ({
    id: `fake-first-${videoId}`,
    videoId,
    userId: 'aidans-friend',
    username: 'aidans_friend',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    text: `first comment! ${getFirstCommentEmoji(videoId)}`,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    likeCount: 12,
    isLiked: false,
  }), [videoId]);

  const [comments, setComments] = useState<Comment[]>(() => {
    const realComments = mockComments.filter((c) => c.videoId === videoId);
    // Add fake first comment at the end (so it appears as oldest/first)
    return [...realComments, fakeFirstComment];
  });
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      videoId,
      userId: 'current-user',
      username: 'you',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
      text: newComment,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const toggleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !c.isLiked,
              likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1,
            }
          : c
      )
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[70vh] rounded-t-3xl bg-card border-border px-0"
      >
        <SheetHeader className="px-4 pb-4 border-b border-border">
          <SheetTitle className="text-lg font-semibold text-center">
            {comments.length} comments
          </SheetTitle>
        </SheetHeader>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[calc(70vh-140px)]">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={comment.avatarUrl}
                  alt={comment.username}
                  className="w-9 h-9 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5">{comment.text}</p>
                  <button
                    onClick={() => toggleCommentLike(comment.id)}
                    className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"
                  >
                    <Heart
                      className={cn(
                        'w-3.5 h-3.5',
                        comment.isLiked && 'fill-like text-like'
                      )}
                    />
                    {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border"
        >
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newComment.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
