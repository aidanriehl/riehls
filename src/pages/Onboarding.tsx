import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2 } from 'lucide-react';
import onboardingBg from '@/assets/onboarding-bg.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SECRET_TAP_COUNT = 5;
const SECRET_TAP_TIMEOUT = 2000; // 2 seconds to complete 5 taps

export default function Onboarding() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Admin login state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { uploadAvatar, updateProfile, refetch } = useProfile();
  const { session, signInWithEmail, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    
    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    // Check if we've reached the secret tap count
    if (tapCountRef.current >= SECRET_TAP_COUNT) {
      setShowAdminLogin(true);
      tapCountRef.current = 0;
      return;
    }
    
    // Reset tap count after timeout
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, SECRET_TAP_TIMEOUT);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: "Please choose an image under 5MB", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProfile = async () => {
    if (!displayName.trim()) {
      toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      // Upload avatar if provided
      if (avatarFile) {
        const { error } = await uploadAvatar(avatarFile, session?.access_token);
        if (error) {
          console.error('Avatar upload failed:', error);
          // Continue anyway - they can add photo later
        }
      }

      // Generate username
      const username = displayName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 20) + Math.random().toString(36).slice(2, 6);
      
      // Update profile
      const { error } = await updateProfile({ 
        display_name: displayName.trim(), 
        bio: bio.trim() || null, 
        username, 
        onboarding_complete: true 
      });
      
      if (error) {
        toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
        setLoading(false);
        return;
      }
      
      await refetch();
      navigate('/', { replace: true, state: { onboardingJustCompleted: true } });
    } catch (err) {
      toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast({ title: "Missing credentials", description: "Please enter email and password", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    const { error } = await signInWithEmail(adminEmail, adminPassword);
    
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // onAuthStateChange will update the user, then we navigate
    // Small delay to allow state to update
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 500);
  };

  const handleBackToOnboarding = () => {
    setShowAdminLogin(false);
    setAdminEmail('');
    setAdminPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image */}
      <img 
        src={onboardingBg} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover object-[center_30%] z-0"
      />
      
      {showAdminLogin ? (
        // Admin login form - centered
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
          <div className="w-full max-w-xs space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Admin Login</h2>
              <p className="text-muted-foreground text-sm mt-1">Sign in with admin credentials</p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Email"
                className="bg-secondary"
                autoComplete="email"
              />
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Password"
                className="bg-secondary"
                autoComplete="current-password"
              />
            </div>
            
            <Button
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <button
              type="button"
              onClick={handleBackToOnboarding}
              className="w-full text-center text-sm text-muted-foreground"
            >
              Back to profile setup
            </button>
          </div>
        </div>
      ) : (
        // Landing page style onboarding
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
          {/* Hero: Logo and tagline */}
          <button
            type="button"
            onClick={handleLogoTap}
            className="text-center mb-10 focus:outline-none select-none cursor-pointer"
            style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
          >
            <h1 className="text-5xl font-bold tracking-tight pointer-events-none mb-2">riehls</h1>
            <p className="text-muted-foreground text-base pointer-events-none">finally, a curated feed</p>
          </button>

          {/* Profile setup form */}
          <div className="w-full max-w-xs space-y-5">
            {/* Avatar upload */}
            <div className="flex flex-col items-center space-y-2">
              <label className="relative cursor-pointer">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center overflow-hidden",
                  avatarPreview ? "" : "bg-secondary border-2 border-dashed border-muted-foreground/50"
                )}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                className="text-primary text-sm font-medium"
              >
                {avatarPreview ? 'Change photo' : 'Add photo'}
              </button>
            </div>

            {/* Name input */}
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="text-center bg-secondary/50 border-border/50 h-12"
              maxLength={50}
            />

            {/* Bio input */}
            <div className="space-y-1">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio (optional)"
                className="resize-none bg-secondary/50 border-border/50 text-center min-h-0"
                rows={2}
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/80
              </p>
            </div>

            {/* Create button */}
            <Button
              onClick={handleCreateProfile}
              disabled={!displayName.trim() || loading}
              className="w-full h-12 bg-primary hover:bg-primary/90"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create profile'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
