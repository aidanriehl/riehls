import { useRef, useState, useEffect } from 'react';
import { Play, Heart } from 'lucide-react';
import { Video } from '@/types';
import { VideoActions } from './VideoActions';
import { VideoCaption } from './VideoCaption';
import { CommentsSheet } from './CommentsSheet';
import { ShareSheet } from './ShareSheet';

interface VideoPlayerProps {
  video: Video;
  isActive: boolean;
  onLike: () => void;
  onSave: () => void;
}

export function VideoPlayer({ video, isActive, onLike, onSave }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const [isSpeedUp, setIsSpeedUp] = useState(false);
  const lastTapRef = useRef<number>(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().catch(() => {
        // Autoplay blocked, user needs to interact
      });
      setIsPlaying(true);
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap - like
      if (!video.isLiked) {
        onLike();
      }
      setDoubleTapHeart(true);
      setTimeout(() => setDoubleTapHeart(false), 600);
    } else {
      // Single tap - toggle play/pause
      const videoElement = videoRef.current;
      if (videoElement) {
        if (videoElement.paused) {
          videoElement.play();
          setIsPlaying(true);
        } else {
          videoElement.pause();
          setIsPlaying(false);
        }
      }
    }

    lastTapRef.current = now;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    const touchX = touch.clientX;

    // Check if touch is in the right 30% of the screen
    if (touchX > screenWidth * 0.7) {
      holdTimeoutRef.current = setTimeout(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
          videoElement.playbackRate = 2;
          setIsSpeedUp(true);
        }
      }, 200); // Small delay to distinguish from tap
    }
  };

  const handleTouchEnd = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.playbackRate = 1;
    }
    setIsSpeedUp(false);
  };

  const handleShare = () => {
    setShowShare(true);
  };

  return (
    <div className="relative h-screen w-full bg-background snap-item">
      {/* Video */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        poster={video.thumbnailUrl}
      />

      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 right-0 h-32 top-gradient pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 caption-gradient pointer-events-none" />

      {/* Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-10 h-10 fill-foreground text-foreground ml-1" />
          </div>
        </div>
      )}

      {/* 2x speed indicator */}
      {isSpeedUp && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-sm">
            <span className="text-sm font-semibold">2x</span>
          </div>
        </div>
      )}

      {/* Double tap heart */}
      {doubleTapHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="w-24 h-24 fill-like text-like heart-burst" />
        </div>
      )}

      {/* Actions sidebar */}
      <div className="absolute right-3 bottom-28">
        <VideoActions
          video={video}
          onLike={onLike}
          onComment={() => setShowComments(true)}
          onSave={onSave}
          onShare={handleShare}
        />
      </div>

      {/* Caption */}
      <div className="absolute left-4 bottom-24 pr-16">
        <VideoCaption caption={video.caption} createdAt={video.createdAt} />
      </div>

      {/* Comments sheet */}
      <CommentsSheet
        videoId={video.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Share sheet */}
      <ShareSheet
        open={showShare}
        onOpenChange={setShowShare}
        videoCaption={video.caption}
      />
    </div>
  );
}
