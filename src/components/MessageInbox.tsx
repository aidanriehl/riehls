import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  oderId: string;
  displayName: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export function MessageInbox() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get all messages where admin is sender or recipient
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          is_read,
          sender_id,
          recipient_id
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error || !messages) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      // Group by conversation partner
      const conversationMap = new Map<string, {
        oderId: string;
        lastMessage: string;
        lastMessageTime: string;
        unreadCount: number;
      }>();

      messages.forEach(msg => {
        const oderId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        
        if (!conversationMap.has(oderId)) {
          conversationMap.set(oderId, {
            oderId,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: (!msg.is_read && msg.recipient_id === user.id) ? 1 : 0,
          });
        } else if (!msg.is_read && msg.recipient_id === user.id) {
          const conv = conversationMap.get(oderId)!;
          conv.unreadCount += 1;
        }
      });

      // Fetch profiles for all conversation partners
      const oderIds = Array.from(conversationMap.keys());
      if (oderIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', oderIds);

      const conversationList: Conversation[] = oderIds.map(oderId => {
        const conv = conversationMap.get(oderId)!;
        const profile = profiles?.find(p => p.id === oderId);
        return {
          oderId,
          displayName: profile?.display_name || 'User',
          avatarUrl: profile?.avatar_url || '/placeholder.svg',
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount,
        };
      });

      // Sort by most recent message
      conversationList.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(conversationList);
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel('inbox-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center h-14 px-4 border-b border-border bg-background">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-semibold">Messages</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Conversations List */}
      <div className="divide-y divide-border">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When users message you, they'll appear here
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.oderId}
              onClick={() => navigate(`/messages/${conversation.oderId}`)}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <UserAvatar
                src={conversation.avatarUrl === '/placeholder.svg' ? null : conversation.avatarUrl}
                name={conversation.displayName}
                className="w-14 h-14"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{conversation.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-medium">
                    {conversation.unreadCount}
                  </span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
