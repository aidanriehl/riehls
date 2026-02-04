import { useState, useCallback } from 'react';
import { Video } from '@/types';
import { mockVideos } from '@/data/mockData';

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>(mockVideos);

  const toggleLike = useCallback((videoId: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId
          ? {
              ...video,
              isLiked: !video.isLiked,
              likeCount: video.isLiked ? video.likeCount - 1 : video.likeCount + 1,
            }
          : video
      )
    );
  }, []);

  const toggleSave = useCallback((videoId: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId
          ? { ...video, isSaved: !video.isSaved }
          : video
      )
    );
  }, []);

  const getSavedVideos = useCallback(() => {
    return videos.filter((video) => video.isSaved);
  }, [videos]);

  return {
    videos,
    toggleLike,
    toggleSave,
    getSavedVideos,
  };
}
