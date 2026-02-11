import { Copy, MessageCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoCaption: string;
  videoId?: string;
}

export function ShareSheet({ open, onOpenChange, videoCaption, videoId }: ShareSheetProps) {
  const navigate = useNavigate();

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
    onOpenChange(false);
  };

  const handleShareText = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this video!',
        text: videoCaption,
        url: window.location.href,
      });
    } else {
      // Fallback for desktop - copy link
      handleCopyLink();
    }
    onOpenChange(false);
  };

  const handleDM = () => {
    onOpenChange(false);
    navigate('/messages', { state: { attachedVideoId: videoId } });
  };

  const shareOptions = [
    {
      icon: Copy,
      label: 'Copy Link',
      onClick: handleCopyLink,
    },
    {
      icon: Send,
      label: 'Send to\nfam gc',
      onClick: handleShareText,
    },
    {
      icon: MessageCircle,
      label: 'DM Aidan',
      onClick: handleDM,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Share</SheetTitle>
        </SheetHeader>
        
        <div className="grid grid-cols-3 gap-4 pb-8">
          {shareOptions.map((option) => (
            <button
              key={option.label}
              onClick={option.onClick}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <option.icon className="w-6 h-6" />
              </div>
              <span className="text-xs text-center whitespace-pre-line">{option.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
