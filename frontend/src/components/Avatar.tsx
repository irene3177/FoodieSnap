import { Link } from 'react-router-dom';

interface AvatarProps {
  src?: string | null; // Avatar URL
  username?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'profile';
  to?: string; // Link
  onClick?: () => void;
  className?: string;
  border?: boolean;
  borderColor?: string;
  interactive?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-16 h-16 text-2xl',
  '2xl': 'w-24 h-24 text-3xl',
  profile: 'w-[clamp(6rem,15vw,8rem)] h-[clamp(6rem,15vw,8rem)] text-[clamp(1.5rem,4vw,2.25rem)]',
};

function Avatar({
  src,
  username,
  size = 'md',
  to,
  onClick,
  className = '',
  border = false,
  borderColor = 'border-accent',
  interactive = true,
}: AvatarProps) {
  const initials = username?.charAt(0).toUpperCase() || 'U';
  const avatarUrl = src;
  const sizeClass = sizeClasses[size];

  const baseClasses = `
    ${sizeClass}
    rounded-full
    flex items-center justify-center
    overflow-hidden flex-shrink-0
    terracotta-gradient
    text-white font-semibold
    ${border ? `border-2 ${borderColor}` : ''}
    ${interactive ? 'hover:shadow-accent hover:scale-[1.02] active:scale-[0.98] transition-all duration-700' : ''}
    ${className}
  `;

  const content = avatarUrl ? (
    <img src={avatarUrl} alt={username || 'User'} className="w-full h-full object-cover" />
  ) : (
    <span className="text-button cursor-pointer">{initials}</span>
  );

  // is a Link
  if (to) {
    return (
      <Link to={to} className={baseClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  // is a Button
  if (onClick) {
    return (
      <button type="button" className={baseClasses} onClick={onClick}>
        {content}
      </button>
    );
  }

  // div
  return <div className={baseClasses}>{content}</div>;
}

export default Avatar;