import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function AdminUpload() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setThumbnailTime(0);
      setThumbnailPreview(null);
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setThumbnailPreview(null);
    setThumbnailTime(0);
    setVideoDuration(0);
  };

  // Capture thumbnail from video at current time
  const captureThumbnail = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setThumbnailPreview(dataUrl);
    }
  };

  // When video loads, set duration and capture initial thumbnail
  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (video) {
      setVideoDuration(video.duration);
      // Seek to 0 to capture initial frame
      video.currentTime = 0;
    }
  };

  // When video seeks to new time, capture thumbnail
  const handleVideoSeeked = () => {
    captureThumbnail();
  };

  // Handle slider change
  const handleTimeChange = (value: number[]) => {
    const time = value[0];
    setThumbnailTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !user) return;

    setUploading(true);

    try {
      // Convert video file to base64
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(videoFile);
      });

      const response = await supabase.functions.invoke('upload-video', {
        body: {
          file: videoBase64,
          filename: videoFile.name,
          caption,
          thumbnailTime: thumbnailTime, // Send the selected thumbnail time
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Upload failed');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Video uploaded!",
        description: "Your video has been published to the feed.",
      });

      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden canvas for thumbnail capture */}
      <canvas ref={canvasRef} className="hidden" />

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
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                src={videoPreview}
                className="aspect-[9/16] max-h-[300px] w-full rounded-xl object-cover bg-black"
                onLoadedMetadata={handleVideoLoaded}
                onSeeked={handleVideoSeeked}
                muted
                playsInline
              />
              <button
                onClick={clearVideo}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnail Picker */}
            {videoDuration > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Choose thumbnail
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {thumbnailTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                  </span>
                </div>
                
                <Slider
                  value={[thumbnailTime]}
                  onValueChange={handleTimeChange}
                  max={videoDuration}
                  step={0.1}
                  className="w-full"
                />

                {/* Thumbnail preview */}
                {thumbnailPreview && (
                  <div className="flex items-center gap-3">
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail preview" 
                      className="w-16 h-24 object-cover rounded-lg"
                    />
                    <span className="text-sm text-muted-foreground">
                      This will be your cover image
                    </span>
                  </div>
                )}
              </div>
            )}
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