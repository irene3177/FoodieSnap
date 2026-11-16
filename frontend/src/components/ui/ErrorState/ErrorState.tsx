import { ReactNode } from 'react';
import { MdErrorOutline } from 'react-icons/md';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  className?: string;
}

function ErrorState({
  title = 'Oops! Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  icon,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex justify-center px-4 py-8 ${className}`}>
      <div className="text-center max-w-lg w-full p-8 md:p-12 glass-card rounded-2xl shadow-theme border">
        <div className="flex justify-center mb-4">
          <div className="text-5xl text-error">
            {icon ?? <MdErrorOutline />}
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-headline-md text-secondary mb-3">
          {title}
        </h2>

        <p className="text-error mb-8">{message}</p>

        {onRetry && (
          <button
            type="button"
            className="btn-primary"
            onClick={onRetry}
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;