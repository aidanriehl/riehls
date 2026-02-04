import { useState } from 'react';
import { Settings, Bookmark, Bell } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { SavedVideos } from '@/components/SavedVideos';
import { NotificationsList } from '@/components/NotificationsList';
import { ProfileSettingsSheet } from '@/components/ProfileSettingsSheet';
import { mockCreator } from '@/data/mockData';
import { useVideos } from '@/hooks/useVideos';
import { cn } from '@/lib/utils';

type Tab = 'saved' | 'notifications';

const DEFAULT_TAB: Tab = 'notifications';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<Tab>(DEFAULT_TAB);
  const { getSavedVideos } = useVideos();
  const savedVideos = getSavedVideos();
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState({
    avatarUrl: mockCreator.avatarUrl,
    displayName: mockCreator.displayName,
    bio: mockCreator.bio,
  });

  const handleProfileSave = (newProfile: typeof profile) => {
    setProfile(newProfile);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - minimal, no border */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-end px-4 h-11">
          <button className="p-2 -mr-2" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Profile info - reduced top padding */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h2 className="text-xl font-bold">{profile.displayName}</h2>
            <p className="text-muted-foreground text-sm mt-1">{profile.bio}</p>
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

      {/* Settings Sheet */}
      <ProfileSettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        currentProfile={profile}
        onSave={handleProfileSave}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;
