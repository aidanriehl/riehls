 import { Video } from '@/types';
 import { Heart } from 'lucide-react';
 
 interface LikedVideosProps {
   videos: Video[];
 }
 
 export function LikedVideos({ videos }: LikedVideosProps) {
   if (videos.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center py-16 px-4">
         <Heart className="w-12 h-12 text-muted-foreground mb-4" />
         <p className="text-muted-foreground text-center">
           No liked videos yet
         </p>
         <p className="text-sm text-muted-foreground text-center mt-1">
           Videos you like will appear here
         </p>
       </div>
     );
   }
 
   return (
     <div className="grid grid-cols-3 gap-0.5">
       {videos.map((video) => (
         <div key={video.id} className="aspect-square relative">
           <img
             src={video.thumbnailUrl}
             alt=""
             className="w-full h-full object-cover"
           />
         </div>
       ))}
     </div>
   );
 }