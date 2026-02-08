import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const { uploadAvatar, updateProfile, refetch } = useProfile();
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleContinue = async () => {
    if (step === 1) {
      if (avatarFile) {
        setLoading(true);
        try {
          const { error } = await uploadAvatar(avatarFile, session?.access_token);
          if (error) {
            toast({ title: "Upload failed", description: "You can add a photo later in settings.", variant: "destructive" });
          }
        } catch (err) {
          toast({ title: "Upload failed", description: "You can add a photo later in settings.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (displayName.trim().length > 0) setStep(3);
    } else {
      setLoading(true);
      const username = displayName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 20) + Math.random().toString(36).slice(2, 6);
      try {
        const { error } = await updateProfile({ display_name: displayName || null, bio: bio || null, username, onboarding_complete: true });
        if (error) {
          toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
          setLoading(false);
          return;
        }
        
        // Wait for profile refetch to ensure DB consistency before navigating
        await refetch();
        
        // Small delay to ensure ProtectedRoute sees the updated profile
        await new Promise(resolve => setTimeout(resolve, 150));
        
        navigate('/', { replace: true });
      } catch (err) {
        toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
        setLoading(false);
      }
    }
  };

  const canContinue = () => {
    if (step === 2) return displayName.trim().length > 0;
    return true;
  };
 
   return (
     <div className="min-h-screen flex flex-col bg-background px-6 pt-8 pb-16">
       {/* Progress */}
       <div className="flex gap-2 mb-8">
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
           <div className="flex-1 flex flex-col items-center justify-center -mt-16 space-y-4">
             <h2 className="text-2xl font-bold text-center">Add a profile photo</h2>
             <p className="text-muted-foreground text-center">
               Help others recognize you
             </p>
             
             <label className="relative cursor-pointer mt-4">
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
           <div className="flex-1 flex flex-col items-center justify-center -mt-16 space-y-4">
             <h2 className="text-2xl font-bold text-center">What's your name?</h2>
             <p className="text-muted-foreground text-center">
               This is how you'll appear to others
             </p>
             
             <Input
               value={displayName}
               onChange={(e) => setDisplayName(e.target.value)}
               placeholder="Your name"
               className="max-w-xs text-center text-lg bg-secondary mt-4"
               maxLength={50}
             />
           </div>
         )}
 
         {/* Step 3: Bio */}
         {step === 3 && (
           <div className="flex-1 flex flex-col items-center justify-center -mt-16 space-y-4">
             <h2 className="text-2xl font-bold text-center">Add a short bio</h2>
             <p className="text-muted-foreground text-center">
               Tell people why you're here
             </p>
             
             <div className="w-full max-w-xs mt-4">
               <Textarea
                 value={bio}
                 onChange={(e) => setBio(e.target.value)}
                 placeholder="A few words about you..."
                 className="resize-none bg-secondary"
                 rows={2}
                 maxLength={80}
               />
               <p className="text-xs text-muted-foreground text-right mt-1">
                {bio.length}/80
               </p>
             </div>
             
             <button
               type="button"
               onClick={handleContinue}
               className="text-muted-foreground text-sm"
               disabled={loading}
             >
               Skip for now
             </button>
           </div>
         )}
       </div>
 
       {/* Continue Button */}
       <div className="flex justify-center mt-6">
         <Button
           onClick={handleContinue}
           disabled={!canContinue() || loading}
           className="w-4/5 max-w-xs"
           size="lg"
         >
          {loading ? 'Saving...' : step === 3 ? 'Complete' : 'Continue'}
         </Button>
       </div>
     </div>
   );
 }