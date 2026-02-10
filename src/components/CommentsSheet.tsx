import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

interface CommentData {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface CommentsSheetProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
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

export function CommentsSheet({ videoId, isOpen, onClose, onCommentCountChange }: CommentsSheetProps) {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch comments from database
  useEffect(() => {
    if (!isOpen) return;

    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('id, text, created_at, user_id, profiles:user_id(username, display_name, avatar_url)')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((c: any) => ({
          id: c.id,
          text: c.text,
          created_at: c.created_at,
          user_id: c.user_id,
          username: c.profiles?.username ?? null,
          display_name: c.profiles?.display_name ?? null,
          avatar_url: c.profiles?.avatar_url ?? null,
        }));
        setComments(mapped);
        onCommentCountChange?.(mapped.length);
      }
      setLoading(false);
    };

    fetchComments();
  }, [isOpen, videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    // Optimistic add
    const optimistic: CommentData = {
      id: `temp-${Date.now()}`,
      text: newComment,
      created_at: new Date().toISOString(),
      user_id: user.id,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };

    const updatedComments = [optimistic, ...comments];
    setComments(updatedComments);
    onCommentCountChange?.(updatedComments.length);
    setNewComment('');

    // Persist
    const { data, error } = await supabase
      .from('comments')
      .insert({ text: newComment, user_id: user.id, video_id: videoId })
      .select('id')
      .single();

    if (!error && data) {
      setComments(prev => prev.map(c => c.id === optimistic.id ? { ...c, id: data.id } : c));
    }
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
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar
                  src={comment.avatar_url}
                  name={comment.display_name || comment.username}
                  className="w-9 h-9 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {comment.display_name || comment.username || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5">{comment.text}</p>
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
              disabled={!newComment.trim() || !user}
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
