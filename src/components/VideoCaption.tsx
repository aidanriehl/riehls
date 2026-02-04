import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCreator } from '@/data/mockData';

interface VideoCaptionProps {
  caption: string;
  createdAt: string;
}

export function VideoCaption({ caption, createdAt }: VideoCaptionProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const maxLength = 80;
  const shouldTruncate = caption.length > maxLength;

  const displayText = expanded || !shouldTruncate 
    ? caption 
    : caption.slice(0, maxLength) + '...';

  return (
    <div className="max-w-[85%]">
      {/* Username row with avatar */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => navigate('/creator')}
          className="flex-shrink-0"
        >
          <img
            src={mockCreator.avatarUrl}
            alt={mockCreator.username}
            className="w-8 h-8 rounded-lg object-cover"
          />
        </button>
        <button 
          onClick={() => navigate('/creator')}
          className="font-semibold text-sm"
        >
          aidan
        </button>
      </div>

      {/* Caption */}
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
