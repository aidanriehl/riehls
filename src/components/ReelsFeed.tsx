import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';
import { useVideos } from '@/hooks/useVideos';
import { Loader2 } from 'lucide-react';

export function ReelsFeed() {
  const { videos, loading, toggleLike, toggleSave, deleteVideo } = useVideos();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const startVideoId = searchParams.get('video');
  const fromCreatorProfile = location.state?.fromCreatorProfile === true;
  const fromProfile = location.state?.fromProfile === true;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToVideo = useRef(false);

  // Scroll to specific video if ID is in URL
  useEffect(() => {
    if (startVideoId && videos.length > 0 && !hasScrolledToVideo.current) {
      const videoIndex = videos.findIndex(v => v.id === startVideoId);
      if (videoIndex !== -1) {
        setActiveIndex(videoIndex);
        const container = containerRef.current;
        if (container) {
          container.scrollTo({ top: videoIndex * container.clientHeight, behavior: 'instant' });
        }
        hasScrolledToVideo.current = true;
        // Clear the URL param after scrolling
        setSearchParams({}, { replace: true });
      }
    }
  }, [startVideoId, videos, setSearchParams]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < videos.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex, videos.length]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No videos yet</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="snap-container scrollbar-hide"
    >
      {videos.map((video, index) => (
        <VideoPlayer
          key={video.id}
          video={video}
          isActive={index === activeIndex}
          onLike={() => toggleLike(video.id)}
          onSave={() => toggleSave(video.id)}
          onDelete={() => deleteVideo(video.id)}
          showBackButton={(fromCreatorProfile || fromProfile) && index === activeIndex}
          backDestination={fromProfile ? '/profile' : '/creator'}
        />
      ))}
    </div>
  );
}
