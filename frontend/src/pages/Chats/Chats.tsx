import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUnreadCount, selectLastMessages } from '../../store/unreadSlice';
import { useAuth } from '../../hooks/useAuth';
import { messagesApi } from '../../services/messagesApi';
import { ChatsSkeleton } from '../../components/Skeleton/ChatsSkeleton';
import { Participant, Conversation } from '../../types';
import * as socket from '../../services/socket';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import { TbMessagesOff } from 'react-icons/tb';
import { FiEdit } from 'react-icons/fi';
import { PiChats } from 'react-icons/pi';
import { MdOutlinePersonSearch } from 'react-icons/md';


function Chats() {
  const { user } = useAuth();
  const unreadCounts = useSelector(selectUnreadCount);
  const lastMessages = useSelector(selectLastMessages);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);


  const getUnreadCount = (conversation: Conversation) => {
    if (!user) return 0;
    const count = unreadCounts[conversation._id] ?? conversation.unreadCount?.[user._id] ?? 0;
    return count;
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

  const getLastMessage = (conversation: Conversation) => {
    const lastFromRedux = lastMessages[conversation._id];
    if (lastFromRedux) {
      return lastFromRedux.text;
    }
    return conversation.lastMessage || 'No messages yet';
  };

  const getLastMessageTime = (conversation: Conversation) => {
    const lastFromRedux = lastMessages[conversation._id];
    if (lastFromRedux) {
      return lastFromRedux.createdAt;
    }
    return conversation.lastMessageAt;
  };

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
        recipient: otherUser
      }
    });
  };

  if (loading) {
    return <ChatsSkeleton />;
  }

  if (!user) {
    return (
      <div className="text-center py-16 px-8 max-w-md mx-auto mt-8">
        <div className="text-6xl mb-4 opacity-70"><TbMessagesOff /></div>
        <h2 className="text-2xl font-semibold text-primary mb-2">Please log in</h2>
        <p className="text-secondary mb-6">You need to be logged in to view your messages</p>
        <Link to="/login" className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover hover:-translate-y-0.5 transition-all">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-[calc(100vh-120px)]">

      {/* Error state */}
      {error && (
        <div className="text-center p-8 bg-error-bg rounded-xl text-error my-6">
          <p className="mb-3">{error}</p>
          <button
            onClick={loadConversations}
            className="px-5 py-2 bg-accent text-white rounded-md border-none cursor-pointer hover:bg-accent-hover transition-colors"
          >Try Again</button>
        </div>
      )}

      {/* Empty state */}
      {conversations.length === 0 && !error && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={<PiChats />}
            title="No Conversations Yet"
            description="Start a conversation with fellow food lovers. Share recipes, ask questions, or just say hello!"
            action={{
              label: "Find People to Chat With",
              to: "/users",
              icon: <MdOutlinePersonSearch />
            }}
          />
        </div>
      )}
      
      {/* Chat list */}
      {conversations.length > 0 && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <h1 className="text-3xl font-headline-md text-primary m-0">Messages</h1>
            <Link to="/users" className="btn-primary hover:text-button">
              <FiEdit className="inline" /> New Chat
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {conversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation);
              const unreadCount = getUnreadCount(conversation);

              if (!otherUser) return null;
              
              return (
                <div
                  key={conversation._id}
                  className={`
                    flex gap-3 p-4 bg-secondary rounded-xl cursor-pointer
                    transition-all duration-200 border
                    hover:bg-border hover:translate-x-1
                    ${unreadCount > 0 ? 'bg-accent/10 border-l-4 border-l-accent' : ''}
                  `}
                  onClick={() => handleConversationClick(conversation._id, otherUser)}
                >
                  {/* Avatar */}
                  <Avatar src={otherUser.avatar} username={otherUser.username} size="xl" border />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline flex-wrap gap-2 mb-1">
                      <span className="font-semibold text-primary text-base">{otherUser?.username || 'Unknown User'}</span>
                      <span className="text-xs text-muted">{formatTime(getLastMessageTime(conversation))}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-sm text-secondary truncate flex-1 m-0">
                        {getLastMessage(conversation) || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-accent text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">{unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
        )}
    </div>
  );
}

export default Chats;