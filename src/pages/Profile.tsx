import { useState } from 'react';
import { Settings, Bookmark, Bell } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { SavedVideos } from '@/components/SavedVideos';
import { NotificationsList } from '@/components/NotificationsList';
import { mockCreator } from '@/data/mockData';
import { useVideos } from '@/hooks/useVideos';
import { cn } from '@/lib/utils';

type Tab = 'saved' | 'notifications';

const DEFAULT_TAB: Tab = 'notifications';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<Tab>(DEFAULT_TAB);
  const { getSavedVideos } = useVideos();
  const savedVideos = getSavedVideos();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-end px-4 h-14">
          <button className="p-2 -mr-2">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Profile info */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-4">
          <img
            src={mockCreator.avatarUrl}
            alt={mockCreator.displayName}
            className="w-20 h-20 rounded-full border-2 border-primary"
          />
          <div>
            <h2 className="text-xl font-bold">{mockCreator.displayName}</h2>
            <p className="text-muted-foreground text-sm mt-1">{mockCreator.bio}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('notifications')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors',
            activeTab === 'notifications'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground'
          )}
        >
          <Bell className="w-5 h-5" />
          <span className="font-medium">Activity</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors',
            activeTab === 'saved'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground'
          )}
        >
          <Bookmark className="w-5 h-5" />
          <span className="font-medium">Saved</span>
        </button>
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === 'saved' ? (
          <SavedVideos videos={savedVideos} />
        ) : (
          <NotificationsList />
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
