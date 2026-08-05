import React, { useState } from 'react';
import { useUserStatus } from '../../hooks/chat/useUserStatus';
import { ChatOptions } from './ChatOptions';
import { MdArrowBack } from 'react-icons/md';
import { CiMenuKebab } from 'react-icons/ci';
import Avatar from '../Avatar';
import { User } from '../../types';

interface ChatHeaderProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onBack: () => void;
  onViewProfile: () => void;
  isOpen?: boolean;
  setIsOpen: (show: boolean) => void;
  onClose?: () => void;
  optionsMenuRef: React.RefObject<HTMLDivElement>;
  onClearChat: () => void;
  onDeleteChat: () => void;
  deleting: boolean;
  currentUser?: User | null;
  currentUserId?: string;
  currentUserAvatar?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  onBack,
  onViewProfile,
  setIsOpen,
  // onClose,
  optionsMenuRef,
  onClearChat,
  onDeleteChat,
  deleting,
  currentUser,
  currentUserId,
  currentUserAvatar
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isOnline, isTyping } = useUserStatus(recipientId);

  const closeMenu = () => setIsMenuOpen(false);
  // Determine status text and class
  const getStatusDisplay = () => {
    if (isTyping) {
      return {
        text: 'Typing...',
        className: 'text-accent italic before:content-["✎"] before:mr-1 before:text-accent before:animate-bounce'
      };
    }
    if (isOnline) {
      return {
        text: 'Online',
        className: 'text-green-500 before:content-[""] before:inline-block before:w-2 before:h-2 before:bg-green-500 before:rounded-full before:mr-1 before:animate-pulse'
      };
    }
    return {
      text: 'Offline',
      className: 'text-muted before:content-[""] before:inline-block before:w-2 before:h-2 before:bg-text-muted before:rounded-full before:mr-1'
    };
  };
  
  const status = getStatusDisplay();

  return (
    <div className="flex items-center justify-between px-8 py-4 bg-secondary border-b flex-shrink-0 min-h-[70px] sticky top-0 z-10 gap-4">
      {/* Back button */}
      <button 
        className="bg-transparent border-none text-accent text-base cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-border hover:-translate-x-0.5"
        onClick={onBack}
        aria-label="Go back"
      >
        <MdArrowBack className="text-xl" />
      </button>

      {/* Recipient */}
      <div
        className="flex items-center gap-3 cursor-pointer transition-opacity duration-200 px-1 py-1 pr-3 rounded-full hover:bg-border group relative"
        onClick={onViewProfile}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onViewProfile()}
      >
        {/* Tooltip */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-primary text-primary px-3 py-1 rounded-md text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-theme border z-[100]">
          View profile
        </div>

        {/* Avatar */}
        <Avatar src={recipientAvatar} username={recipientName} border />
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="font-semibold text-primary text-base truncate">{recipientName || 'User'}</h3>
          <span className={`text-xs flex items-center ${status.className}`}>
            {status.text}
          </span>
        </div>
      </div>
      <button
        onClick={() => setIsMenuOpen(true)}
      >
        <CiMenuKebab />
      </button>

      <ChatOptions
        isOpen={isMenuOpen}
        setIsOpen={setIsOpen}
        onClose={closeMenu}
        optionsMenuRef={optionsMenuRef}
        onViewProfile={onViewProfile}
        onClearChat={onClearChat}
        onDeleteChat={onDeleteChat}
        deleting={deleting}
        currentUser={currentUser}
        currentUserId={currentUserId}
        currentUserAvatar={currentUserAvatar}
      />
    </div>
  );
};