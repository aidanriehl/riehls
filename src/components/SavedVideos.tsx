import { useNavigate } from 'react-router-dom';
import { Play, Bookmark } from 'lucide-react';
import { Video } from '@/types';

interface SavedVideosProps {
  videos: Video[];
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

export function SavedVideos({ videos }: SavedVideosProps) {
  const navigate = useNavigate();

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Bookmark className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No saved videos</h3>
        <p className="text-muted-foreground text-sm max-w-[240px]">
          Tap the bookmark icon on videos you want to save and watch later
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {videos.map((video) => (
        <button
          key={video.id}
          onClick={() => navigate('/')}
          className="relative aspect-[9/16] bg-secondary overflow-hidden group"
        >
          <img
            src={video.thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Overlay on hover/focus */}
          <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-8 h-8 fill-foreground text-foreground" />
          </div>

          {/* View count */}
          <div className="absolute bottom-1 left-1 flex items-center gap-1 text-xs font-medium">
            <Play className="w-3 h-3 fill-foreground" />
            <span>{formatCount(video.likeCount)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
