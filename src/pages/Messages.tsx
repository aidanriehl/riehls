import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Heart, Reply, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  isFromCreator: boolean;
  timestamp: Date;
  isLiked: boolean;
  replyToId?: string;
}

interface CreatorProfile {
  displayName: string;
  avatarUrl: string;
}

const SUGGESTIONS = [
  'low key you\'re bad 😈',
  'You up? 🧐',
  'like for tbh? 🤝',
];

const Messages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [revealedTimestamp, setRevealedTimestamp] = useState<string | null>(null);
  const [swipeState, setSwipeState] = useState<{ id: string; offset: number } | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const lastTapTime = useRef<{ [key: string]: number }>({});

  // Fetch admin/creator profile
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      // Get the admin user's profile
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (adminRole) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', adminRole.user_id)
          .single();
        
        if (profile) {
          setCreatorProfile({
            displayName: profile.display_name || 'aidan',
            avatarUrl: profile.avatar_url || '/placeholder.svg',
          });
        }
      }
    };

    fetchCreatorProfile();
  }, []);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isFromCreator: false,
      timestamp: new Date(),
      isLiked: false,
      replyToId: replyingTo?.id,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
    setReplyingTo(null);

    // Simulate auto-reply after 1 second
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Thanks for the message! I'll get back to you soon 🙌",
          isFromCreator: true,
          timestamp: new Date(),
          isLiked: false,
        },
      ]);
    }, 1000);
  };

  const handleDoubleTap = (messageId: string) => {
    const now = Date.now();
    const lastTap = lastTapTime.current[messageId] || 0;
    
    if (now - lastTap < 300) {
      // Double tap detected - toggle like
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isLiked: !msg.isLiked } : msg
        )
      );
      lastTapTime.current[messageId] = 0;
    } else {
      lastTapTime.current[messageId] = now;
    }
  };

  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent, message: Message) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    // Only handle horizontal swipes
    if (deltaY > 30) return;
    
    const isFromCreator = message.isFromCreator;
    
    // For timestamp reveal: swipe left on any message
    if (deltaX < -20) {
      setSwipeState({ id: message.id, offset: Math.max(deltaX, -100) });
      if (deltaX < -50) {
        setRevealedTimestamp(message.id);
      }
    }
    // For reply: swipe right on creator messages, swipe left on sent messages
    else if ((isFromCreator && deltaX > 20) || (!isFromCreator && deltaX < -20)) {
      const offset = isFromCreator ? Math.min(deltaX, 80) : Math.max(deltaX, -80);
      setSwipeState({ id: message.id, offset });
    }
  };

  const handleTouchEnd = (message: Message) => {
    if (!swipeState || swipeState.id !== message.id) return;
    
    const offset = swipeState.offset;
    const isFromCreator = message.isFromCreator;
    
    // Check for reply trigger
    if ((isFromCreator && offset > 60) || (!isFromCreator && offset < -60)) {
      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setReplyingTo(message);
    }
    
    // Hide timestamp after 2 seconds if revealed
    if (revealedTimestamp === message.id) {
      setTimeout(() => {
        setRevealedTimestamp(null);
      }, 2000);
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

  const getReplyMessage = (replyToId: string) => {
    return messages.find((msg) => msg.id === replyToId);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 border-b border-border bg-background">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => navigate('/creator')}
          className="flex items-center gap-3"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={creatorProfile?.avatarUrl || '/placeholder.svg'} />
            <AvatarFallback>{creatorProfile?.displayName?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{creatorProfile?.displayName || 'aidan'}</span>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const replyMessage = message.replyToId ? getReplyMessage(message.replyToId) : null;
          const isSwipingThis = swipeState?.id === message.id;
          const swipeOffset = isSwipingThis ? swipeState.offset : 0;
          
          return (
            <div
              key={message.id}
              className={`flex items-center gap-2 ${message.isFromCreator ? 'justify-start' : 'justify-end'}`}
            >
              {/* Reply arrow for creator messages (shows on swipe right) */}
              {message.isFromCreator && swipeOffset > 40 && (
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-muted transition-opacity"
                  style={{ opacity: Math.min((swipeOffset - 40) / 40, 1) }}
                >
                  <Reply className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              
              <div
                className="relative"
                style={{ 
                  transform: `translateX(${swipeOffset}px)`,
                  transition: isSwipingThis ? 'none' : 'transform 0.2s ease-out'
                }}
                onTouchStart={(e) => handleTouchStart(e, message.id)}
                onTouchMove={(e) => handleTouchMove(e, message)}
                onTouchEnd={() => handleTouchEnd(message)}
                onClick={() => handleDoubleTap(message.id)}
              >
                {/* Reply preview above message */}
                {replyMessage && (
                  <div 
                    className={`text-xs text-muted-foreground mb-1 px-3 py-1 rounded-lg bg-muted/50 max-w-[200px] truncate ${
                      message.isFromCreator ? 'ml-0' : 'ml-auto'
                    }`}
                  >
                    ↩ {replyMessage.content}
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.isFromCreator
                      ? 'bg-muted text-foreground'
                      : 'bg-[hsl(var(--dm-sent))] text-[hsl(var(--dm-sent-foreground))]'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                
                {/* Heart reaction */}
                {message.isLiked && (
                  <div className={`absolute -bottom-3 ${message.isFromCreator ? 'left-3' : 'right-3'}`}>
                    <Heart className="w-4 h-4 fill-[hsl(var(--like-color))] text-[hsl(var(--like-color))]" />
                  </div>
                )}
              </div>
              
              {/* Timestamp (revealed on swipe left) */}
              {revealedTimestamp === message.id && (
                <span className="text-xs text-muted-foreground animate-fade-in whitespace-nowrap">
                  {formatTime(message.timestamp)}
                </span>
              )}
              
              {/* Reply arrow for sent messages (shows on swipe left) */}
              {!message.isFromCreator && swipeOffset < -40 && (
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-muted transition-opacity"
                  style={{ opacity: Math.min((-swipeOffset - 40) / 40, 1) }}
                >
                  <Reply className="w-4 h-4 text-muted-foreground scale-x-[-1]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        {/* Reply preview */}
        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Replying to</p>
              <p className="text-sm truncate">{replyingTo.content}</p>
            </div>
            <button 
              onClick={() => setReplyingTo(null)}
              className="p-1 ml-2"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}
        
        {/* Suggestion bubbles - only show when no messages */}
        {messages.length === 0 && (
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
};

export default Messages;
