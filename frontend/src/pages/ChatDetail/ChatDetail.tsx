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
import { MessageListSkeleton } from '../../components/Skeleton/MessageListSkeleton';
import { ChatHeaderSkeleton } from '../../components/Skeleton/ChatHeaderSkeleton';
import { MessageInputSkeleton } from '../../components/Skeleton/MessageInputSkeleton';
import * as socket from '../../services/socket';
// import Loader from '../../components/Loader/Loader';
import './ChatDetail.css';

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
    recipientName,
    recipientAvatar,
    recipientId
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
    showOptions,
    setShowOptions,
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
      
      // Re-join the conversation
      // if (conversationId) {
      //   socket.joinChat(conversationId);
      // }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [user?._id, conversationId]);


  const handleViewProfile = () => {
    if (recipientId) {
      window.location.href = `/user/${recipientId}`;
    }
  };

  const handleBack = () => {
    window.location.href = '/chats';
  };

  if (loading) {
    return (
      <div className="chat-detail">
        <ChatHeaderSkeleton />
        <MessageListSkeleton />
        <MessageInputSkeleton />
      </div>
    );
  }

  return (
    <div className="chat-detail">
      <ChatHeader
        recipientId={recipientId}
        recipientName={recipientName}
        recipientAvatar={recipientAvatar}
        onBack={handleBack}
        onViewProfile={handleViewProfile}
        showOptions={showOptions}
        setShowOptions={setShowOptions}
        optionsMenuRef={optionsMenuRef}
        onClearChat={handleClearChat}
        onDeleteChat={handleDeleteConversation}
        deleting={deleting}
        currentUserId={user?._id}
        currentUserAvatar={user?.avatar}
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