import './MessageListSkeleton.css';

export const MessageListSkeleton = () => {
  return (
    <div className="message-list-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="message-skeleton">
          <div className="message-skeleton__avatar"></div>
          <div className="message-skeleton__bubble">
            <div className="message-skeleton__line"></div>
            <div className="message-skeleton__line short"></div>
          </div>
        </div>
      ))}
    </div>
  );
};