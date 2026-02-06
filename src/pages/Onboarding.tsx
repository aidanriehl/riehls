 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Camera, ArrowRight, Check } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { useProfile } from '@/hooks/useProfile';
 import { useToast } from '@/hooks/use-toast';
 import { cn } from '@/lib/utils';
 
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { uploadAvatar, updateProfile, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Please choose an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      // Clear previously uploaded URL if user selects a new file
      setUploadedAvatarUrl(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    setLoading(true);

    try {
      // Only upload if we have a file AND haven't already uploaded it
      if (step === 1 && avatarFile && !uploadedAvatarUrl) {
        console.log('Onboarding: Starting avatar upload...');
        const { error, url } = await uploadAvatar(avatarFile);
        console.log('Onboarding: Avatar upload result:', { error: error?.message || null, url });
        
        if (error) {
          toast({
            title: "Upload failed",
            description: `${error.message || "Could not upload photo."} You can skip this step and add a photo later.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Save the URL to persistent state
        if (url) {
          setUploadedAvatarUrl(url);
          console.log('Onboarding: Avatar URL saved to state:', url);
        }

        // Refetch profile to confirm the update succeeded
        await refetch();
      }

      if (step < 3) {
        setStep(step + 1);
      } else {
        await handleComplete();
      }
    } catch (err) {
      console.error('Onboarding step error:', err);
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
 
   const handleComplete = async () => {
     // Prevent multiple calls
     if (isCompleting) return;
     setIsCompleting(true);
     
     // Generate username from display name
     const username = displayName
       .toLowerCase()
       .replace(/\s+/g, '')
       .replace(/[^a-z0-9]/g, '')
       .slice(0, 20) + Math.random().toString(36).slice(2, 6);
 
     console.log('Onboarding: Completing profile with username:', username);
 
     const { error } = await updateProfile({
       display_name: displayName || null,
       bio: bio || null,
       username,
       onboarding_complete: true,
     });
 
     if (error) {
       console.error('Onboarding: Profile update failed:', error);
       setIsCompleting(false);
       toast({
         title: "Failed to save profile",
         description: error.message || "Could not save your profile. Please try again.",
         variant: "destructive",
       });
     } else {
       console.log('Onboarding: Profile update successful, navigating to home');
       // Navigate immediately after successful update
       navigate('/', { replace: true });
     }
   };
 
   const canContinue = () => {
     if (step === 1) return true; // Avatar is optional
     if (step === 2) return displayName.trim().length > 0;
     return true; // Bio is optional
   };
 
   return (
     <div className="min-h-screen flex flex-col bg-background px-6 py-12">
       {/* Progress */}
       <div className="flex gap-2 mb-12">
         {[1, 2, 3].map((i) => (
           <div
             key={i}
             className={cn(
               "h-1 flex-1 rounded-full transition-colors",
               i <= step ? "bg-foreground" : "bg-secondary"
             )}
           />
         ))}
       </div>
 
       <div className="flex-1 flex flex-col">
         {/* Step 1: Avatar */}
         {step === 1 && (
           <div className="flex-1 flex flex-col items-center justify-center space-y-6">
             <h2 className="text-2xl font-bold text-center">Add a profile photo</h2>
             <p className="text-muted-foreground text-center">
               Help others recognize you
             </p>
             
             <label className="relative cursor-pointer">
               <div className={cn(
                 "w-32 h-32 rounded-full flex items-center justify-center overflow-hidden",
                 avatarPreview ? "" : "bg-secondary border-2 border-dashed border-muted-foreground"
               )}>
                 {avatarPreview ? (
                   <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                 ) : (
                   <Camera className="w-10 h-10 text-muted-foreground" />
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
               className="text-primary font-medium"
             >
               {avatarPreview ? 'Change photo' : 'Upload photo'}
             </button>
           
           <button
             type="button"
             onClick={() => setStep(2)}
             className="text-muted-foreground text-sm"
           >
             Skip for now
           </button>
           </div>
         )}
 
         {/* Step 2: Display Name */}
         {step === 2 && (
           <div className="flex-1 flex flex-col items-center justify-center space-y-6">
             <h2 className="text-2xl font-bold text-center">What's your name?</h2>
             <p className="text-muted-foreground text-center">
               This is how you'll appear to others
             </p>
             
             <Input
               value={displayName}
               onChange={(e) => setDisplayName(e.target.value)}
               placeholder="Your name"
               className="max-w-xs text-center text-lg bg-secondary"
               maxLength={50}
             />
           </div>
         )}
 
         {/* Step 3: Bio */}
         {step === 3 && (
           <div className="flex-1 flex flex-col items-center justify-center space-y-6">
             <h2 className="text-2xl font-bold text-center">Add a short bio</h2>
             <p className="text-muted-foreground text-center">
               Tell people a little about yourself
             </p>
             
             <div className="w-full max-w-xs">
               <Textarea
                 value={bio}
                 onChange={(e) => setBio(e.target.value)}
                 placeholder="A few words about you..."
                className="resize-none bg-secondary h-14"
                rows={1}
                maxLength={80}
               />
               <p className="text-xs text-muted-foreground text-right mt-1">
                {bio.length}/80
               </p>
             </div>
             
             <button
               type="button"
               onClick={handleComplete}
               className="text-muted-foreground text-sm"
               disabled={loading}
             >
               Skip for now
             </button>
           </div>
         )}
       </div>
 
       {/* Continue Button */}
       <Button
         onClick={handleNext}
         disabled={!canContinue() || loading}
         className="w-full mt-8"
         size="lg"
       >
         {loading ? (
           'Saving...'
         ) : step === 3 ? (
           <>
             <Check className="w-5 h-5 mr-2" />
             Complete
           </>
         ) : (
           <>
             Continue
             <ArrowRight className="w-5 h-5 ml-2" />
           </>
         )}
       </Button>
     </div>
   );
 }