import './ChatHeaderSkeleton.css';

export const ChatHeaderSkeleton = () => {
  return (
    <div className="chat-header-skeleton">
      <div className="chat-header-skeleton__back"></div>
      <div className="chat-header-skeleton__avatar"></div>
      <div className="chat-header-skeleton__info">
        <div className="chat-header-skeleton__name"></div>
        <div className="chat-header-skeleton__status"></div>
      </div>
      <div className="chat-header-skeleton__options"></div>
    </div>
  );
};