import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store/store';
import { resetUnread } from '../../store/unreadSlice'; 
import { useChatRecipient } from '../../hooks/chat/useChatRecipient';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatScroll } from '../../hooks/chat/useChatScroll';
import { useChatOptions } from '../../hooks/chat/useChatOptions';
import { ChatHeader } from '../../components/Chat/ChatHeader';
import { MessageList } from '../../components/Chat/MessageList';
import { MessageInput } from '../../components/Chat/MessageInput';
import { ScrollToBottomButton } from '../../components/Chat/ScrollToBottomButton';
import { ChatDetailSkeleton } from '../../components/Skeleton/ChatDetailSkeleton';
import * as socket from '../../services/socket';

function ChatDetail() {
  const dispatch = useAppDispatch();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const hasMarkedRead = useRef(false);
  const hasJoinedRoom = useRef(false);

  // Ensure connection
  useEffect(() => {
    if (user?._id) {
      socket.ensureConnection(user._id);
    }
  }, [user?._id]);

  // Custom hooks
  const {
    recipient
  } = useChatRecipient(conversationId, user?._id);
  const {
    messages,
    loading,
    sendMessage,
    setMessages
  } = useChatMessages(conversationId, user);
  const {
    showScrollButton,
    scrollToBottom,
    messagesContainerRef,
    messagesEndRef,
    handleScroll
  } = useChatScroll(messages);
  const {
    isOpen,
    setIsOpen,
    onClose,
    deleting,
    optionsMenuRef,
    handleDeleteConversation,
    handleClearChat
  } = useChatOptions(conversationId, () => setMessages([]));


  // Join chat room
  useEffect(() => {
    if (!conversationId) return;
    if (hasJoinedRoom.current) return;
    socket.joinChat(conversationId);
    hasJoinedRoom.current = true;
    
    return () => {
      if (hasJoinedRoom.current) {
        socket.leaveChat(conversationId);
        hasJoinedRoom.current = false;
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !user?._id) return;
    if (hasMarkedRead.current) return;
    
    socket.markRead(conversationId, user._id);
    hasMarkedRead.current = true;
  }, [conversationId, user?._id]);

  useEffect(() => {
    if (!conversationId || !user?._id) return;

    const handleMessagesRead = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId === user._id) {
        dispatch(resetUnread(conversationId));
      }
    };

    const unsubscribe = socket.onMessagesRead(handleMessagesRead);

    return () => unsubscribe();
  }, [conversationId, user?._id, dispatch]);

  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && user?._id) {
      // Ensure socket is connected
      socket.ensureConnection(user._id);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [user?._id, conversationId]);


  const handleViewProfile = () => {
    if (recipient?._id) {
      window.location.href = `/user/${recipient?._id}`;
    }
  };

  const handleBack = () => {
    window.location.href = '/chats';
  };

  if (loading) {
    return <ChatDetailSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-primary relative overflow-hidden">
      <ChatHeader
        recipient={recipient}
        onBack={handleBack}
        onViewProfile={handleViewProfile}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onClose={onClose}
        optionsMenuRef={optionsMenuRef}
        onClearChat={handleClearChat}
        onDeleteChat={handleDeleteConversation}
        deleting={deleting}
        currentUser={user}
      />

      <MessageList
        messages={messages}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        onScroll={handleScroll}
        currentUserId={user?._id}
      />

      {showScrollButton && <ScrollToBottomButton onClick={scrollToBottom} />}

      <MessageInput
        conversationId={conversationId || ''}
        userId={user?._id || ''}
        onSendMessage={sendMessage}
        disabled={deleting}
      />
    </div>
  );
}

export default ChatDetail;