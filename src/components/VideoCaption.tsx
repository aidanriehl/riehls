import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VideoCaptionProps {
  caption: string | null;
  createdAt: string;
  creator?: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    username: string | null;
  } | null;
  onDelete?: () => void;
}

export function VideoCaption({ caption, createdAt, creator, onDelete }: VideoCaptionProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const maxLength = 80;
  const displayCaption = caption || '';
  const shouldTruncate = displayCaption.length > maxLength;

  const displayText = expanded || !shouldTruncate 
    ? displayCaption 
    : displayCaption.slice(0, maxLength) + '...';

  const displayName = creator?.displayName || creator?.username || 'Creator';
  const avatarUrl = creator?.avatarUrl || '/placeholder.svg';

  // Format date as "Jan 15"
  const formattedDate = format(new Date(createdAt), 'MMM d');

  return (
    <div className="max-w-[85%]">
      {/* Username row with avatar */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => navigate('/creator')}
          className="flex-shrink-0"
        >
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-lg object-cover"
          />
        </button>
        <button 
          onClick={() => navigate('/creator')}
          className="font-semibold text-sm"
        >
          {displayName}
        </button>
      </div>

      {/* Caption */}
      {displayCaption && (
        <p className="text-sm leading-relaxed">
          {displayText}
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-muted-foreground font-medium"
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </p>
      )}

      {/* Post date + Admin delete */}
      <div className="flex items-center gap-3 mt-1.5">
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
        {isAdmin && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-xs text-destructive font-medium">
                Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this video?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this video and remove it from your profile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDelete}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
