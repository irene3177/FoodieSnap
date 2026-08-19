import React, { useState } from 'react';
import { useUserStatus } from '../../hooks/chat/useUserStatus';
import { ChatOptions } from './ChatOptions';
import { MdArrowBack } from 'react-icons/md';
import { CiMenuKebab } from 'react-icons/ci';
import Avatar from '../Avatar';
import { Participant, User } from '../../types';

interface ChatHeaderProps {
  recipient?: Participant | null;
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
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  recipient,
  onBack,
  onViewProfile,
  setIsOpen,
  optionsMenuRef,
  onClearChat,
  onDeleteChat,
  deleting,
  currentUser,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isOnline, isTyping } = useUserStatus(recipient?._id || '');

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
    <header className="flex-shrink-0 bg-header shadow-theme z-[1000]">
      <div className="flex justify-between items-center py-[clamp(0.5rem,2vw,1rem)] 
        max-w-[792px] mx-auto gap-[clamp(0.5rem,2vw,1.5rem)]">
        {/* Back button */}
        <button
          title="Back To Chats"
          className="bg-transparent border-none text-accent text-base cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-border hover:-translate-x-0.5"
          onClick={onBack}
          aria-label="Go back to Chats"
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
          <Avatar src={recipient?.avatar} username={recipient?.username} border />
          <div className="flex flex-col gap-0.5 min-w-0">
            <h3 className="font-semibold text-primary text-base truncate">{recipient?.username || 'User'}</h3>
            <span className={`text-xs flex items-center ${status.className}`}>
              {status.text}
            </span>
          </div>
        </div>
        <button
          title="Menu"
          className="text-secondary hover:scale-105 transition-all duration-300 hover:text-accent"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open User Menu"
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
        />
      </div>
    </header>
  );
};