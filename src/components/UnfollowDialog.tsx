import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UnfollowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnfollowDialog({ open, onOpenChange }: UnfollowDialogProps) {
  const handleUnfollow = () => {
    // TODO: Implement Apple IAP for unfollow fee
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[300px] rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">Are you sure? 🤔</DialogTitle>
          <DialogDescription className="text-center">
            There's a small fee to unfollow...
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex !flex-col gap-2 sm:!flex-col">
          <Button 
            variant="destructive" 
            onClick={handleUnfollow}
            className="w-full"
          >
            Unfollow ($5)
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Stay Following
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
