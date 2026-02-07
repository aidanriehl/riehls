export interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
  creator?: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    username: string | null;
  } | null;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isAdmin: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment';
  userId: string;
  username: string;
  avatarUrl: string;
  videoId: string;
  videoThumbnail: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}
