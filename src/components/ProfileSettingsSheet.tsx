import { useState, useRef, useEffect } from 'react';
import { Plus, LogOut } from 'lucide-react';
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
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadAvatar, updateProfile } = useProfile();
  const { session, signOut } = useAuth();

  // Sync form state when sheet opens or currentProfile changes
  useEffect(() => {
    if (open) {
      setDisplayName(currentProfile.displayName);
      setBio(currentProfile.bio);
      setAvatarUrl(currentProfile.avatarUrl);
      setAvatarPreview(null);
    }
  }, [open, currentProfile.displayName, currentProfile.bio, currentProfile.avatarUrl]);

  const handleSave = async () => {
    // Persist to database
    const { error } = await updateProfile({
      display_name: displayName,
      bio: bio,
    });

    if (error) {
      toast({
        title: "Update failed",
        description: "Could not save your changes. Please try again.",
        variant: "destructive",
      });
      return;
    }

    onSave({ avatarUrl: avatarPreview || avatarUrl, displayName, bio });
    toast({
      title: "Profile updated",
      description: "Your changes have been saved.",
    });
    onOpenChange(false);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Please choose an image under 5MB", variant: "destructive" });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    try {
      const { error, url } = await uploadAvatar(file, session?.access_token);
      if (error) {
        toast({ title: "Upload failed", description: "Could not upload photo. Please try again.", variant: "destructive" });
        setAvatarPreview(null);
      } else if (url) {
        setAvatarUrl(url);
        toast({ title: "Photo updated", description: "Your new photo has been saved." });
      }
    } catch (err) {
      toast({ title: "Upload failed", description: "Could not upload photo. Please try again.", variant: "destructive" });
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onOpenChange(false);
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
                src={avatarPreview || avatarUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <button
                onClick={handlePhotoClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center border-2 border-background"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            <button
              onClick={handlePhotoClick}
              disabled={uploading}
              className="text-sm text-primary font-medium"
            >
              {uploading ? 'Uploading...' : 'Change photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
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

          {/* Logout Link */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-destructive transition-colors py-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
