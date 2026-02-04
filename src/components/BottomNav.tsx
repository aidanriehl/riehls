import { Home, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/' },
    { icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/30">
      <div className="flex items-center justify-around h-12 max-w-md mx-auto">
        {navItems.map(({ icon: Icon, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center justify-center w-16 h-full transition-all',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon
                className="w-7 h-7"
                strokeWidth={isActive ? 2.5 : 1.5}
                fill={isActive ? 'currentColor' : 'none'}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
