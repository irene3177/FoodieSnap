import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { messagesApi } from '../../services/messagesApi';
import { Participant, ConversationResponse } from '../../types';

export const useChatRecipient = (conversationId: string | undefined, userId: string | undefined) => {
  const location = useLocation();
  const [recipient, setRecipient] = useState<Participant | null>(null);

  // Get recipient info from location state
  useEffect(() => {
    if (location.state?.recipient) {
      setRecipient(location.state.recipient);
    }
  }, [location]);

  // Load recipient info from conversation if not available
  useEffect(() => {
    const loadRecipient = async () => {
      if (!conversationId || recipient?._id || !userId) return;

      try {
        const response = await messagesApi.getConversationById(conversationId);
        if (response.success && response.data) {
          const data = response.data as ConversationResponse;
          const otherUser = data.participants?.find(
            (p: Participant) => p._id !== userId
          );
          if (otherUser) {
            setRecipient(otherUser);
          }
        }
      } catch (error) {
        console.error('Error loading recipient:', error);
      }
    };

    loadRecipient();
  }, [conversationId, recipient?._id, userId]);

  return { recipient };
};