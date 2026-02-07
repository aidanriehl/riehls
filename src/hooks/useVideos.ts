import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface VideoWithCreator {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
  creator: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    username: string | null;
  } | null;
}

export function useVideos() {
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch videos from database
  const fetchVideos = async () => {
    setLoading(true);
    
    // Get published videos with creator info
    const { data: videosData, error } = await supabase
      .from('videos')
      .select(`
        id,
        video_url,
        thumbnail_url,
        caption,
        like_count,
        comment_count,
        created_at,
        creator_id,
        creator:profiles!videos_creator_id_fkey(id, display_name, avatar_url, username)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
      return;
    }

    // Get user's likes if logged in
    let userLikes: Set<string> = new Set();
    if (user) {
      const { data: likesData } = await supabase
        .from('likes')
        .select('video_id')
        .eq('user_id', user.id);
      
      if (likesData) {
        userLikes = new Set(likesData.map(l => l.video_id));
      }
    }

    // Transform to our video format
    const transformedVideos: VideoWithCreator[] = (videosData || []).map((v) => ({
      id: v.id,
      videoUrl: v.video_url,
      thumbnailUrl: v.thumbnail_url,
      caption: v.caption,
      likeCount: v.like_count,
      commentCount: v.comment_count,
      createdAt: v.created_at,
      isLiked: userLikes.has(v.id),
      isSaved: false, // TODO: Implement saved videos table
      creator: v.creator ? {
        id: v.creator.id,
        displayName: v.creator.display_name,
        avatarUrl: v.creator.avatar_url,
        username: v.creator.username,
      } : null,
    }));

    setVideos(transformedVideos);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const toggleLike = useCallback(async (videoId: string) => {
    if (!user) return;

    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    // Optimistic update
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              isLiked: !v.isLiked,
              likeCount: v.isLiked ? v.likeCount - 1 : v.likeCount + 1,
            }
          : v
      )
    );

    // Persist to database
    if (video.isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, video_id: videoId });
    }
  }, [user, videos]);

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

  const getLikedVideos = useCallback(() => {
    return videos.filter((video) => video.isLiked);
  }, [videos]);

  const deleteVideo = useCallback(async (videoId: string) => {
    // Optimistic update - remove from local state
    setVideos((prev) => prev.filter((v) => v.id !== videoId));

    // Delete from database
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting video:', error);
      // Refetch to restore state on error
      await fetchVideos();
      return false;
    }
    return true;
  }, []);

  return {
    videos,
    loading,
    toggleLike,
    toggleSave,
    getSavedVideos,
    getLikedVideos,
    deleteVideo,
    refetch: fetchVideos,
  };
}
