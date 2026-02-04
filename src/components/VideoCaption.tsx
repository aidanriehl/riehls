import { useState } from 'react';

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
    <div className="max-w-[80%]">
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
