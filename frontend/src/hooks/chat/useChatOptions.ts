import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { messagesApi } from '../../services/messagesApi';

export const useChatOptions = (conversationId: string | undefined, onClearMessages: () => void) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showOptions, setShowOptions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      setDeleting(true);
      setShowOptions(false);
      
      try {
        const response = await messagesApi.deleteConversation(conversationId);
        if (response.success) {
          dispatch(showToast({ message: 'Conversation deleted successfully', type: 'success' }));
          navigate('/chats');
        } else {
          dispatch(showToast({ message: response.error || 'Failed to delete conversation', type: 'error' }));
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        dispatch(showToast({ message: 'Failed to delete conversation', type: 'error' }));
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleClearChat = async () => {
    if (!conversationId) return;
    
    if (window.confirm('Are you sure you want to clear all messages in this conversation? This action cannot be undone.')) {
      setShowOptions(false);
      
      try {
        const response = await messagesApi.clearChat(conversationId);
        if (response.success) {
          onClearMessages();
          dispatch(showToast({ message: 'Chat history cleared', type: 'success' }));
        } else {
          dispatch(showToast({ message: response.error || 'Failed to clear chat', type: 'error' }));
        }
      } catch (error) {
        console.error('Error clearing chat:', error);
        dispatch(showToast({ message: 'Failed to clear chat', type: 'error' }));
      }
    }
  };

  return {
    showOptions,
    setShowOptions,
    deleting,
    optionsMenuRef,
    handleDeleteConversation,
    handleClearChat
  };
};