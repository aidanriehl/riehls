import { useAuth } from '@/hooks/useAuth';
import { MessageInbox } from '@/components/MessageInbox';
import { MessageChat } from '@/components/MessageChat';

const Messages = () => {
  const { isAdmin } = useAuth();

  // Admin sees inbox, regular users go straight to chat with admin
  if (isAdmin) {
    return <MessageInbox />;
  }

  return <MessageChat />;
};

export default Messages;
