import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/store';
import { resetUnread } from '../../store/unreadSlice';
import { messagesApi } from '../../services/messagesApi';
import { useAuth } from '../../hooks/useAuth';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatScroll } from '../../hooks/chat/useChatScroll';
import { MessageList } from '../Chat/MessageList';
import { MessageInput } from '../Chat/MessageInput';
import { ScrollToBottomButton } from '../Chat/ScrollToBottomButton';
import * as socket from '../../services/socket';
import './MessageModal.css';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

function MessageModal({ isOpen, onClose, recipientId, recipientName, recipientAvatar }: MessageModalProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  useEffect(() => {
    if (!isOpen || !recipientId) return;

    const loadConversation = async () => {
      setIsLoadingConversation(true);
      const response = await messagesApi.getConversation(recipientId);
      if (response.success && response.data) {
        setConversationId(response.data._id);
        dispatch(resetUnread(response.data._id));

        await messagesApi.markAsRead(response.data._id);
      }
      setIsLoadingConversation(false);
    };
    loadConversation();
  }, [isOpen, recipientId, dispatch]);

  const {
    messages,
    loading,
    sendMessage
  } = useChatMessages(conversationId || undefined, user);

  const {
    showScrollButton,
    scrollToBottom,
    messagesContainerRef,
    messagesEndRef,
    handleScroll
  } = useChatScroll(messages);

  // Join conversation room
  useEffect(() => {
    if (!conversationId || !isOpen) return;

    socket.joinChat(conversationId);
      
    return () => {
      socket.leaveChat(conversationId);
    };
  }, [conversationId, isOpen]);

  if (isLoadingConversation || loading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="message-modal__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="message-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="message-modal__header">
                <div className="message-modal__recipient">
                  <img 
                    src={recipientAvatar || 'https://picsum.photos/40/40'} 
                    alt={recipientName}
                    className="message-modal__avatar"
                  />
                  <span className="message-modal__name">{recipientName}</span>
                </div>
                <button className="message-modal__close" onClick={onClose}>✕</button>
              </div>
              <div className="message-modal__loading">Loading conversation...</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && conversationId && (
        <motion.div
          className="message-modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="message-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="message-modal__header">
              <div className="message-modal__recipient">
                <img 
                  src={recipientAvatar || 'https://picsum.photos/40/40'} 
                  alt={recipientName}
                  className="message-modal__avatar"
                />
                <span className="message-modal__name">{recipientName}</span>
              </div>
              <button className="message-modal__close" onClick={onClose}>✕</button>
            </div>

            <MessageList
              messages={messages}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              onScroll={handleScroll}
              currentUserId={user?._id}
            />

            {showScrollButton && <ScrollToBottomButton onClick={scrollToBottom} />}

            <MessageInput
              conversationId={conversationId}
              userId={user?._id || ''}
              onSendMessage={sendMessage}
              disabled={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MessageModal;