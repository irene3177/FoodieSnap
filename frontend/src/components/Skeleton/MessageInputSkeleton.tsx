import './MessageInputSkeleton.css';

export const MessageInputSkeleton = () => {
  return (
    <div className="message-input-skeleton">
      <div className="message-input-skeleton__field"></div>
      <div className="message-input-skeleton__button"></div>
    </div>
  );
};