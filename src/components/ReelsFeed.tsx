import { useState, useRef, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { useVideos } from '@/hooks/useVideos';

export function ReelsFeed() {
  const { videos, toggleLike, toggleSave } = useVideos();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
        />
      ))}
    </div>
  );
}
