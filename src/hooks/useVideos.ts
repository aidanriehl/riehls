import { useState, useCallback, useMemo } from 'react';
import { Video } from '@/types';
import { mockVideos } from '@/data/mockData';

// Sort videos by createdAt descending (newest first)
const sortedMockVideos = [...mockVideos].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>(sortedMockVideos);

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
