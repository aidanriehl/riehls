 import { useState, useEffect } from 'react';
 import {
   Dialog,
   DialogContent,
 } from '@/components/ui/dialog';
 import { DollarSign } from 'lucide-react';
 
 interface TipCountdownDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function TipCountdownDialog({ open, onOpenChange }: TipCountdownDialogProps) {
   const [countdown, setCountdown] = useState(5);
   const [isComplete, setIsComplete] = useState(false);
 
   useEffect(() => {
     if (!open) {
       setCountdown(5);
       setIsComplete(false);
       return;
     }
 
     if (countdown > 0) {
       const timer = setTimeout(() => {
         setCountdown(countdown - 1);
       }, 1000);
       return () => clearTimeout(timer);
      } else if (countdown === 0 && !isComplete) {
        setIsComplete(true);
        // TODO: Implement Apple IAP for tipping
        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      }
   }, [open, countdown, isComplete, onOpenChange]);
 
   const progress = ((5 - countdown) / 5) * 100;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-[280px] rounded-3xl border-none bg-background/95 backdrop-blur-xl p-8">
         <div className="flex flex-col items-center gap-6">
           {/* Countdown Circle */}
           <div className="relative w-32 h-32">
             {/* Background circle */}
             <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
               <circle
                 cx="50"
                 cy="50"
                 r="45"
                 fill="none"
                 stroke="hsl(var(--muted))"
                 strokeWidth="6"
               />
               {/* Progress circle */}
               <circle
                 cx="50"
                 cy="50"
                 r="45"
                 fill="none"
                 stroke="hsl(var(--dm-sent))"
                 strokeWidth="6"
                 strokeLinecap="round"
                 strokeDasharray={`${2 * Math.PI * 45}`}
                 strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                 className="transition-all duration-1000 ease-linear"
               />
             </svg>
             {/* Center content */}
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-4xl font-bold tabular-nums">
                 {countdown}
               </span>
             </div>
           </div>
 
            {/* Text */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-5 h-5 text-[hsl(var(--dm-sent))]" />
                <span className="text-xl font-semibold">Sending $5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                to Aidan
              </p>
            </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }