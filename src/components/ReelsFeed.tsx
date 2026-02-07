import { useState, useRef, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { useVideos } from '@/hooks/useVideos';
import { Loader2 } from 'lucide-react';

export function ReelsFeed() {
  const { videos, loading, toggleLike, toggleSave } = useVideos();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // Default to unmuted
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleMute = () => setIsMuted(!isMuted);

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
          onToggleMute={toggleMute}
          isMuted={isMuted}
        />
      ))}
    </div>
  );
}
