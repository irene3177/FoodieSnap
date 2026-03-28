import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUnreadCount } from '../../store/unreadSlice';
import { useAuth } from '../../hooks/useAuth';
import { messagesApi } from '../../services/messagesApi';
import Loader from '../../components/Loader/Loader';
import { Participant, Conversation } from '../../types';
import * as socket from '../../services/socket';
import './Chats.css';


function Chats() {
  const { user } = useAuth();
  const unreadCounts = useSelector(selectUnreadCount);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  console.log('💬 Chats render - unreadCounts from Redux:', unreadCounts);

  const getUnreadCount = (conversation: Conversation) => {
    if (!user) return 0;
    const count = unreadCounts[conversation._id] ?? conversation.unreadCount?.[user._id] ?? 0;
    console.log(`💬 Unread for ${conversation._id}:`, count);
    return count;
    //return unreadCounts[conversation._id] ?? conversation.unreadCount?.[user._id] ?? 0;
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    const response = await messagesApi.getConversations();
    
    if (!isMountedRef.current) return;

    if (response.success && response.data) {
      setConversations(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to load conversations');
    }
    setLoading(false);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    isMountedRef.current = true;
    loadConversations();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadConversations]);

  // Refresh when page becomes visible again (after returning from chat)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?._id) {
        console.log('👁️ Chats page became visible, recfreshing conversations...');
        // Ensure socket is connected
        socket.ensureConnection(user._id);
        // Refresh conversations
        loadConversations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?._id, loadConversations]);

  const getOtherParticipant = (conversation: Conversation): Participant | undefined => {
    return conversation.participants.find(p => p._id !== user?._id);
  };


  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else if (hours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleConversationClick = (conversationId: string, otherUser: Participant) => {
    navigate(`/chat/${conversationId}`, { 
      state: {
        recipientName: otherUser?.username,
        recipientAvatar: otherUser?.avatar,
        recipientId: otherUser?._id
      }
    });
  };

  if (loading) {
    return <Loader message="Loading conversations..." />;
  }

  if (!user) {
    return (
      <div className="chats-page__unauthorized">
        <div className="chats-page__empty-icon">💬</div>
        <h2>Please log in</h2>
        <p>You need to be logged in to view your messages</p>
        <Link to="/login" className="chats-page__explore-link">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="chats-page">
      <div className="chats-page__header">
        <h1 className="chats-page__title">Messages</h1>
        <Link to="/users" className="chats-page__new-chat">
          + New Chat
        </Link>
      </div>

      {error && (
        <div className="chats-page__error">
          <p>{error}</p>
          <button onClick={loadConversations}>Try Again</button>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="chats-page__empty">
          <div className="chats-page__empty-icon">💬</div>
          <h2>No messages yet</h2>
          <p>Start a conversation with other food enthusiasts!</p>
          <Link to="/users" className="chats-page__explore-link">
            Find People to Chat With
          </Link>
        </div>
      ) : (
        <div className="chats-page__list">
          {conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            const unreadCount = getUnreadCount(conversation);

            if (!otherUser) return null;
            
            return (
              <div
                key={conversation._id}
                className={`chat-item ${unreadCount > 0 ? 'chat-item--unread' : ''}`}
                onClick={() => handleConversationClick(conversation._id, otherUser)}
              >
                <div className="chat-item__avatar">
                  {otherUser?.avatar ? (
                    <img src={otherUser.avatar} alt={otherUser.username} />
                  ) : (
                    <span>{otherUser?.username?.charAt(0).toUpperCase() || '?'}</span>
                  )}
                </div>
                
                <div className="chat-item__info">
                  <div className="chat-item__header">
                    <span className="chat-item__name">{otherUser?.username || 'Unknown User'}</span>
                    <span className="chat-item__time">{formatTime(conversation.lastMessageAt)}</span>
                  </div>
                  <div className="chat-item__preview">
                    <p className="chat-item__message">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="chat-item__badge">{unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Chats;