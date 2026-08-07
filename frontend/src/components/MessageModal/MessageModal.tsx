// src/components/MessageModal/MessageModal.tsx
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
import { MessageModalSkeleton } from '../Skeleton/MessageModalSkeleton';
import * as socket from '../../services/socket';
import { MdClose } from 'react-icons/md';
// import { LuSend } from 'react-icons/lu';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Participant } from '../../types';
import Avatar from '../Avatar';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Participant | null;
}

function MessageModal({ isOpen, onClose, recipient }: MessageModalProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen || !recipient?._id) return;

    const loadConversation = async () => {
      setIsLoadingConversation(true);
      const response = await messagesApi.getConversation(recipient?._id);
      if (response.success && response.data) {
        setConversationId(response.data._id);
        dispatch(resetUnread(response.data._id));

        await messagesApi.markAsRead(response.data._id);
      }
      setIsLoadingConversation(false);
    };
    loadConversation();
  }, [isOpen, recipient?._id, dispatch]);

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

  useEffect(() => {
    if (!conversationId || !isOpen) return;

    socket.joinChat(conversationId);
      
    return () => {
      socket.leaveChat(conversationId);
    };
  }, [conversationId, isOpen]);

  const isLoading = isLoadingConversation || loading;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1100] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-primary rounded-2xl w-full max-w-md h-[600px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden relative"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-primary flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar src={recipient?.avatar} username={recipient?.username} border /> 
                <span className="font-semibold text-primary text-base">
                  {recipient?.username}
                </span>
              </div>
              <button
                className="bg-transparent border-none text-secondary text-xl cursor-pointer p-2 rounded-lg flex items-center justify-center w-8 h-8 hover:bg-border transition-colors"
                onClick={onClose}
                aria-label="Close"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <MessageModalSkeleton />
            ) : (
              <>
                <MessageList
                  messages={messages}
                  messagesContainerRef={messagesContainerRef}
                  messagesEndRef={messagesEndRef}
                  onScroll={handleScroll}
                  currentUserId={user?._id}
                />

                {showScrollButton && (
                  <ScrollToBottomButton onClick={scrollToBottom} />
                )}

                <MessageInput
                  conversationId={conversationId!}
                  userId={user?._id || ''}
                  onSendMessage={sendMessage}
                  disabled={false}
                />
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MessageModal;