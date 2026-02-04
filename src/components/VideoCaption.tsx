import { useState } from 'react';
import { mockCreator } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface VideoCaptionProps {
  caption: string;
}

export function VideoCaption({ caption }: VideoCaptionProps) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 80;
  const shouldTruncate = caption.length > maxLength;

  const displayText = expanded || !shouldTruncate 
    ? caption 
    : caption.slice(0, maxLength) + '...';

  return (
    <div className="flex flex-col gap-2 max-w-[80%]">
      {/* Creator info */}
      <div className="flex items-center gap-2">
        <img
          src={mockCreator.avatarUrl}
          alt={mockCreator.username}
          className="w-8 h-8 rounded-full border-2 border-foreground/20"
        />
        <span className="font-semibold text-sm">@{mockCreator.username}</span>
      </div>

      {/* Caption text */}
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
    </div>
  );
}
