import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Heart, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
  isLiked: boolean;
  isFromMe: boolean;
}

interface ChatPartner {
  id: string;
  displayName: string;
  avatarUrl: string;
}

const SUGGESTIONS = [
  'low key you\'re bad 😈',
  'You up? 🧐',
  'like for tbh? 🤝',
];

interface MessageChatProps {
  partnerId?: string;
}

// Small component to lazily load a video thumbnail
function VideoThumbnail({ videoId }: { videoId: string }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase
      .from('videos')
      .select('thumbnail_url')
      .eq('id', videoId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setThumbUrl(data.thumbnail_url);
      });
  }, [videoId]);
  return thumbUrl ? (
    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-muted animate-pulse" />
  );
}

export function MessageChat({ partnerId: propPartnerId }: MessageChatProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { oderId } = useParams<{ oderId: string }>();
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedTimestamp, setRevealedTimestamp] = useState<string | null>(null);
  const [swipeState, setSwipeState] = useState<{ id: string; offset: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const lastTapTime = useRef<{ [key: string]: number }>({});

  // Check for recipientId and attachedVideoId passed via location state
  const stateRecipientId = (location.state as { recipientId?: string })?.recipientId;
  const stateAttachedVideoId = (location.state as { attachedVideoId?: string })?.attachedVideoId;
  
  const [attachedVideo, setAttachedVideo] = useState<{ id: string; thumbnailUrl: string | null } | null>(null);

  // Determine the chat partner ID - prioritize state, then props, then URL params
  const partnerId = stateRecipientId || propPartnerId || oderId;

  // Load attached video thumbnail
  useEffect(() => {
    if (!stateAttachedVideoId) return;
    const fetchVideo = async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, thumbnail_url')
        .eq('id', stateAttachedVideoId)
        .maybeSingle();
      if (data) {
        setAttachedVideo({ id: data.id, thumbnailUrl: data.thumbnail_url });
      }
    };
    fetchVideo();
  }, [stateAttachedVideoId]);

  // Fetch admin ID for regular users
  useEffect(() => {
    const initChat = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      let targetPartnerId = partnerId;

      // If no partnerId and not admin, get admin ID
      if (!targetPartnerId && !isAdmin) {
        const { data: adminId } = await supabase.rpc('get_admin_user_id');
        if (adminId) {
          targetPartnerId = adminId;
        }
      }

      if (!targetPartnerId) {
        setLoading(false);
        return;
      }

      // Fetch partner profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', targetPartnerId)
        .maybeSingle();

      if (profile) {
        setChatPartner({
          id: profile.id,
          displayName: profile.display_name || 'User',
          avatarUrl: profile.avatar_url || '/placeholder.svg',
        });
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${targetPartnerId}),and(sender_id.eq.${targetPartnerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData.map(msg => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.sender_id,
          createdAt: new Date(msg.created_at),
          isLiked: false, // Local state for heart reactions
          isFromMe: msg.sender_id === user.id,
        })));

        // Mark unread messages as read
        const unreadIds = messagesData
          .filter(msg => !msg.is_read && msg.recipient_id === user.id)
          .map(msg => msg.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }

      setLoading(false);
    };

    initChat();
  }, [user, partnerId, isAdmin]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user || !chatPartner) return;

    const channel = supabase
      .channel(`chat-${chatPartner.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as any;
          // Only add if it's part of this conversation
          if (
            (msg.sender_id === user.id && msg.recipient_id === chatPartner.id) ||
            (msg.sender_id === chatPartner.id && msg.recipient_id === user.id)
          ) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, {
                id: msg.id,
                content: msg.content,
                senderId: msg.sender_id,
                createdAt: new Date(msg.created_at),
                isLiked: false,
                isFromMe: msg.sender_id === user.id,
              }];
            });

            // Mark as read if we're the recipient
            if (msg.recipient_id === user.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', msg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatPartner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachedVideo) || !user || !chatPartner) return;

    let content = newMessage.trim();
    
    // If there's an attached video, prepend a video reference
    if (attachedVideo) {
      const videoRef = `[video:${attachedVideo.id}]`;
      content = content ? `${videoRef} ${content}` : videoRef;
      setAttachedVideo(null);
    }
    
    if (!content) return;
    
    setNewMessage('');

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      content,
      senderId: user.id,
      createdAt: new Date(),
      isLiked: false,
      isFromMe: true,
    }]);

    // Insert into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: chatPartner.id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return;
    }

    // Replace temp message with real one
    setMessages(prev => prev.map(m => 
      m.id === tempId ? {
        id: data.id,
        content: data.content,
        senderId: data.sender_id,
        createdAt: new Date(data.created_at),
        isLiked: false,
        isFromMe: true,
      } : m
    ));
  };

  const handleDoubleTap = (messageId: string) => {
    const now = Date.now();
    const lastTap = lastTapTime.current[messageId] || 0;
    
    if (now - lastTap < 300) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isLiked: !msg.isLiked } : msg
        )
      );
      lastTapTime.current[messageId] = 0;
    } else {
      lastTapTime.current[messageId] = now;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent, message: Message) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    if (deltaY > 30) return;
    
    if (deltaX < -20) {
      setSwipeState({ id: message.id, offset: Math.max(deltaX, -100) });
      if (deltaX < -50) {
        setRevealedTimestamp(message.id);
      }
    }
  };

  const handleTouchEnd = (message: Message) => {
    if (revealedTimestamp === message.id) {
      setTimeout(() => setRevealedTimestamp(null), 2000);
    }
    setSwipeState(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 border-b border-border bg-background">
        <button onClick={() => isAdmin ? navigate('/messages') : navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => navigate('/creator')}
          className="flex items-center gap-3"
        >
          <UserAvatar
            src={chatPartner?.avatarUrl === '/placeholder.svg' ? null : chatPartner?.avatarUrl}
            name={chatPartner?.displayName}
            className="w-10 h-10"
          />
          <span className="font-semibold">{chatPartner?.displayName || 'User'}</span>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isSwipingThis = swipeState?.id === message.id;
          const swipeOffset = isSwipingThis ? swipeState.offset : 0;
          
          // Check if message contains a video reference
          const videoMatch = message.content.match(/\[video:([^\]]+)\]/);
          const videoId = videoMatch ? videoMatch[1] : null;
          const textContent = message.content.replace(/\[video:[^\]]+\]\s?/, '').trim();

          return (
            <div
              key={message.id}
              className={`flex items-center gap-2 ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="relative"
                style={{ 
                  transform: `translateX(${swipeOffset}px)`,
                  transition: isSwipingThis ? 'none' : 'transform 0.2s ease-out'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={(e) => handleTouchMove(e, message)}
                onTouchEnd={() => handleTouchEnd(message)}
                onClick={() => handleDoubleTap(message.id)}
              >
                <div
                  className={`max-w-[75%] rounded-2xl overflow-hidden ${
                    message.isFromMe
                      ? 'bg-[hsl(var(--dm-sent))] text-[hsl(var(--dm-sent-foreground))]'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {videoId && (
                    <div 
                      className="w-48 h-28 bg-muted cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); navigate(`/?video=${videoId}`); }}
                    >
                      <VideoThumbnail videoId={videoId} />
                    </div>
                  )}
                  {textContent && <p className="text-sm px-4 py-2">{textContent}</p>}
                  {!textContent && !videoId && <p className="text-sm px-4 py-2">{message.content}</p>}
                </div>
                
                {message.isLiked && (
                  <div className={`absolute -bottom-3 ${message.isFromMe ? 'right-3' : 'left-3'}`}>
                    <Heart className="w-4 h-4 fill-[hsl(var(--like-color))] text-[hsl(var(--like-color))]" />
                  </div>
                )}
              </div>
              
              {revealedTimestamp === message.id && (
                <span className="text-xs text-muted-foreground animate-fade-in whitespace-nowrap">
                  {formatTime(message.createdAt)}
                </span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        {/* Suggestion bubbles - only show when no messages */}
        {messages.length === 0 && !isAdmin && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex-shrink-0 px-4 py-2 rounded-full border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {/* Attached video preview */}
        {attachedVideo && (
          <div className="px-4 pt-3">
            <div className="relative inline-block rounded-lg overflow-hidden border border-border">
              <img
                src={attachedVideo.thumbnailUrl || '/placeholder.svg'}
                alt="Attached video"
                className="w-20 h-14 object-cover"
              />
              <button
                onClick={() => setAttachedVideo(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        
        {/* Input row */}
        <div className="flex gap-3 items-center p-4">
          <Input
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 rounded-full bg-transparent border-muted-foreground/30"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-full bg-[hsl(var(--dm-sent))] flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-[hsl(var(--dm-sent-foreground))]" />
          </button>
        </div>
      </div>
    </div>
  );
}
