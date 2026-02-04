import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ProfileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: {
    avatarUrl: string;
    displayName: string;
    bio: string;
  };
  onSave: (profile: { avatarUrl: string; displayName: string; bio: string }) => void;
}

export function ProfileSettingsSheet({
  open,
  onOpenChange,
  currentProfile,
  onSave,
}: ProfileSettingsSheetProps) {
  const [displayName, setDisplayName] = useState(currentProfile.displayName);
  const [bio, setBio] = useState(currentProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl);
  const { toast } = useToast();

  const handleSave = () => {
    onSave({ avatarUrl, displayName, bio });
    toast({
      title: "Profile updated",
      description: "Your changes have been saved.",
    });
    onOpenChange(false);
  };

  const handlePhotoChange = () => {
    // For now, show a toast - later this would open a file picker
    toast({
      title: "Photo upload coming soon",
      description: "This feature is being developed.",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-primary"
              />
              <button
                onClick={handlePhotoChange}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center border-2 border-background"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            <button
              onClick={handlePhotoChange}
              className="text-sm text-primary font-medium"
            >
              Change photo
            </button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="bg-secondary border-border"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
