import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useScrollLock } from '../../hooks/useScrollLock';
import { selectTotalUnread } from '../../store/unreadSlice';
import { NavLinks, PersonalLinks } from '../../constants';
import { RiChatDeleteLine, RiDeleteBin5Line } from 'react-icons/ri';
import { MdClose, MdOutlineDarkMode } from 'react-icons/md';
import Avatar from '../Avatar';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import ConfirmModal from '../ConfirmModal';
import { User } from '../../types';


interface ChatOptionsProps {
  isOpen: boolean;
  setIsOpen: (show: boolean) => void;
  onClose: () => void;
  optionsMenuRef: React.RefObject<HTMLDivElement>;
  onViewProfile: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
  deleting: boolean;
  currentUser?: User | null;
}

export const ChatOptions: React.FC<ChatOptionsProps> = ({
  isOpen,
  setIsOpen,
  onClose,
  onClearChat,
  onDeleteChat,
  currentUser,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const totalUnread = useSelector(selectTotalUnread);

  useScrollLock(true);

  const handleClearChat = async () => {
    setShowClearChatConfirm(false);
    onClose?.();
    onClearChat?.();
  };

  const handleDeleteChat = async () => {
    setShowDeleteConfirm(false);
    onClose?.();
    onDeleteChat?.();
  };
  return (
    <>
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-full max-w-[428px] z-50
          bg-primary rounded-l-2xl
          border-l border
          shadow-2xl
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <button className="absolute right-0 mr-8 mt-6 btn-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <MdClose className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 px-8 p-4 bg-transparent border-b">
          <Avatar to="/me" src={currentUser?.avatar} username={currentUser?.username} onClick={onClose} size="lg" border/>
          <div className=" min-w-0">
            <Link to={`/me`} onClick={() => setIsOpen(false)}>
              <h4 className="hover:text-accent-hover text-lg transition-all duration-300 block font-semibold text-secondary mb-0.5 truncate">{currentUser?.username}</h4>
            </Link>
            <p className="text-muted text-xs truncate cursor-default">{currentUser?.email}</p>
          </div>
        </div>

        <div className="w-full bg-secondary rounded-b-xl overflow-y-auto scrollbar-thin">
          {/* Menu Items */}
          <div className="flex flex-col pt-2 pb-8 px-8 space-y-2">
            
            {/* Navigation */}
            <div className="pb-2 border-b space-y-2">
              <p className="py-2 uppercase text-muted text-xs cursor-default text-outline tracking-widest">Navigation</p>

              {NavLinks.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-2 py-2  text-base rounded-lg hover:bg-border transition-all duration-300 no-underline w-full text-left ${isActive ? 'text-accent border-l-2 border-accent bg-accent-secondary-bg' : 'text-secondary hover:text-accent hover:bg-border hover:-translate-y-[1px]'}
                    `} 
                  onClick={onClose}>
                  <Icon /> {label}
                </NavLink>
              ))}
            </div>

            {/* Personal */}
            <div className="pb-2 border-b space-y-2">
              <p className="py-2 uppercase text-muted text-xs cursor-default text-outline tracking-widest">Personal</p>

              {PersonalLinks.map(({ path, label, icon: Icon }) => (
                <div className="relative">
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) => `flex items-center gap-3 px-2 py-2 text-secondary text-base rounded-lg transition-all duration-300 hover:-translate-y-[1px] no-underline w-full text-left ${isActive ? 'text-accent border-l-2 border-accent bg-accent-secondary-bg' : 'text-secondary hover:text-accent hover:bg-border hover:-translate-y-[1px]'}`} 
                    onClick={onClose}>
                    <Icon /> {label}
                    {path === '/chats' && totalUnread > 0 && (
                      <span className="absolute right-4 bg-accent text-button text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    )}
                  </NavLink>
                </div>
              ))}
            </div>

            {/* Chat Settings */}
            <div className="pb-2 border-b space-y-2">
              <p className="py-2 uppercase text-muted text-xs cursor-default text-outline tracking-widest">Chat Settings</p>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between text-base px-2 py-2 rounded-lg hover:bg-border transition-all hover:-translate-y-[1px] cursor-pointer group">
                <span className="text-secondary hover:text-accent-hover">
                  <MdOutlineDarkMode className="inline mr-2"/> Dark / Light Mode</span>
                <ThemeToggle />
              </div>

              <button 
                className="flex items-center gap-3 px-2 py-2 text-secondary text-base rounded-lg hover:bg-border hover:text-accent-hover transition-all hover:-translate-y-[1px] w-full text-left bg-transparent border-none cursor-pointer" 
                onClick={() => {
                  setShowClearChatConfirm(true);
                  onClose?.();
                }}
              >
                <RiChatDeleteLine className="" /> Clear Chat History
              </button>

              <button 
                className="flex items-center gap-3 px-2 py-2 text-heart text-base rounded-lg hover:bg-border transition-all hover:-translate-y-[1px] w-full text-left bg-transparent border-none cursor-pointer" 
                onClick={() => {
                  setShowDeleteConfirm(true);
                  onClose?.();
                }}
              >
                <RiDeleteBin5Line /> Delete Conversation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Chat Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteChat}
        title="Delete Conversation"
        body={<p>Are you sure you want to delete this conversation? This action cannot be undone.</p>}
        label="Yes, Delete This Conversation"
      />

      {/* Clear Chat Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearChatConfirm}
        onClose={() => setShowClearChatConfirm(false)}
        onConfirm={handleClearChat}
        title="Clear Chat History"
        body={<p>Are you sure you want to clear all messages in this conversation? This action cannot be undone.</p>}
        label="Yes, Clear Chat History"
      />
    </>
  );
};