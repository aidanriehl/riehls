 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Upload, X, ArrowLeft } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { useToast } from '@/hooks/use-toast';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 
 export default function AdminUpload() {
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [videoPreview, setVideoPreview] = useState<string | null>(null);
   const [caption, setCaption] = useState('');
   const [uploading, setUploading] = useState(false);
   const { user } = useAuth();
   const { toast } = useToast();
   const navigate = useNavigate();
 
   const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       setVideoFile(file);
       setVideoPreview(URL.createObjectURL(file));
     }
   };
 
   const clearVideo = () => {
     setVideoFile(null);
     if (videoPreview) {
       URL.revokeObjectURL(videoPreview);
       setVideoPreview(null);
     }
   };
 
   const handleUpload = async () => {
     if (!videoFile || !user) return;
 
     setUploading(true);
 
     try {
       // Convert file to base64 for edge function
       const reader = new FileReader();
       reader.readAsDataURL(videoFile);
       
       reader.onload = async () => {
         const base64 = reader.result as string;
         
         const response = await supabase.functions.invoke('upload-video', {
           body: {
             file: base64,
             filename: videoFile.name,
             caption,
           },
         });
 
         if (response.error) {
           throw response.error;
         }
 
         toast({
           title: "Video uploaded!",
           description: "Your video has been published to the feed.",
         });
 
         navigate('/');
       };
 
       reader.onerror = () => {
         throw new Error('Failed to read file');
       };
     } catch (error) {
       console.error('Upload error:', error);
       toast({
         title: "Upload failed",
         description: error instanceof Error ? error.message : "Something went wrong",
         variant: "destructive",
       });
       setUploading(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="flex items-center justify-between p-4 border-b border-border">
         <button onClick={() => navigate(-1)}>
           <ArrowLeft className="w-6 h-6" />
         </button>
         <h1 className="font-semibold">Upload Video</h1>
         <div className="w-6" />
       </header>
 
       <div className="p-6 space-y-6">
         {/* Video Upload Area */}
         {!videoPreview ? (
           <label className="block cursor-pointer">
             <div className="aspect-[9/16] max-h-[400px] rounded-xl border-2 border-dashed border-muted-foreground flex flex-col items-center justify-center gap-4 bg-secondary">
               <Upload className="w-12 h-12 text-muted-foreground" />
               <div className="text-center">
                 <p className="font-medium">Select video to upload</p>
                 <p className="text-sm text-muted-foreground">MP4 or WebM</p>
               </div>
             </div>
             <input
               type="file"
               accept="video/mp4,video/webm"
               onChange={handleVideoChange}
               className="hidden"
             />
           </label>
         ) : (
           <div className="relative">
             <video
               src={videoPreview}
               className="aspect-[9/16] max-h-[400px] w-full rounded-xl object-cover bg-black"
               controls
             />
             <button
               onClick={clearVideo}
               className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
         )}
 
         {/* Caption */}
         <div className="space-y-2">
           <Label htmlFor="caption">Caption</Label>
           <Textarea
             id="caption"
             value={caption}
             onChange={(e) => setCaption(e.target.value)}
             placeholder="Write a caption..."
             className="bg-secondary resize-none"
             rows={3}
             maxLength={500}
           />
           <p className="text-xs text-muted-foreground text-right">
             {caption.length}/500
           </p>
         </div>
 
         {/* Upload Button */}
         <Button
           onClick={handleUpload}
           disabled={!videoFile || uploading}
           className="w-full"
           size="lg"
         >
           {uploading ? 'Uploading...' : 'Publish'}
         </Button>
       </div>
     </div>
   );
 }