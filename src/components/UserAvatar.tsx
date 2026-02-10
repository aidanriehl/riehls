import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Deterministic color from a string — always the same color for the same name
function stringToColor(str: string): string {
  const colors = [
    'hsl(0, 70%, 50%)',    // red
    'hsl(25, 70%, 50%)',   // orange
    'hsl(45, 70%, 50%)',   // amber
    'hsl(120, 40%, 45%)',  // green
    'hsl(170, 50%, 45%)',  // teal
    'hsl(200, 60%, 50%)',  // sky
    'hsl(230, 55%, 55%)',  // blue
    'hsl(260, 50%, 55%)',  // violet
    'hsl(290, 45%, 50%)',  // purple
    'hsl(330, 55%, 50%)',  // pink
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface UserAvatarProps {
  src: string | null | undefined;
  name: string | null | undefined;
  className?: string;
}

export function UserAvatar({ src, name, className }: UserAvatarProps) {
  const displayName = name || 'U';
  const initial = displayName[0]?.toUpperCase() || 'U';

  return (
    <Avatar className={cn('h-10 w-10', className)}>
      {src && <AvatarImage src={src} alt={displayName} className="object-cover" />}
      <AvatarFallback
        style={{ backgroundColor: stringToColor(displayName) }}
        className="text-white font-semibold"
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
