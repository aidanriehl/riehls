import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

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

  const formattedDate = format(new Date(createdAt), 'MMM d');

  return (
    <div className="max-w-[80%]">
      {/* Username */}
      <button 
        onClick={() => navigate('/creator')}
        className="font-semibold text-sm mb-1 block"
      >
        aidan
      </button>

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

      {/* Date */}
      <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
    </div>
  );
}
