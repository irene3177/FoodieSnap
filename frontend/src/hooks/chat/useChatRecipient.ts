import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { messagesApi } from '../../services/messagesApi';
import { Participant, ConversationResponse } from '../../types';

export const useChatRecipient = (conversationId: string | undefined, userId: string | undefined) => {
  const location = useLocation();
  const [recipientName, setRecipientName] = useState('');
  const [recipientAvatar, setRecipientAvatar] = useState('');
  const [recipientId, setRecipientId] = useState('');

  // Get recipient info from location state
  useEffect(() => {
    if (location.state) {
      setRecipientName(location.state.recipientName || '');
      setRecipientAvatar(location.state.recipientAvatar || '');
      setRecipientId(location.state.recipientId || '');
    }
  }, [location]);

  // Load recipient info from conversation if not available
  useEffect(() => {
    const loadRecipient = async () => {
      if (!conversationId || recipientId || !userId) return;

      try {
        const response = await messagesApi.getConversationById(conversationId);
        if (response.success && response.data) {
          const data = response.data as ConversationResponse;
          const otherUser = data.participants?.find(
            (p: Participant) => p._id !== userId
          );
          if (otherUser) {
            setRecipientName(otherUser.username);
            setRecipientAvatar(otherUser.avatar || '');
            setRecipientId(otherUser._id);
          }
        }
      } catch (error) {
        console.error('Error loading recipient:', error);
      }
    };

    loadRecipient();
  }, [conversationId, recipientId, userId]);

  return { recipientName, recipientAvatar, recipientId };
};