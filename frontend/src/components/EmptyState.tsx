import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineRestaurantMenu, MdOutlineChat } from 'react-icons/md';

interface EmptyStateProps {
  icon: string | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    to: string;
    icon: string | ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction,
  className = '',
  iconSize = 'lg' 
}: EmptyStateProps) {

  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0 });
  const iconRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!iconRef.current) return;
    
    const rect = iconRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateX = (e.clientY - centerY) / 15;
    const rotateY = (e.clientX - centerX) / 15;
    
    setTargetRotation({ x: -rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTargetRotation({ x: 0, y: 0 });
  };

  const sizeClasses = {
    sm: 'w-24 h-24 text-4xl',
    md: 'w-32 h-32 text-5xl',
    lg: 'w-48 h-48 text-7xl',
  };

  useEffect(() => {
    const animate = () => {
      setRotation(prev => ({
        x: prev.x + (targetRotation.x - prev.x) * 0.08,
        y: prev.y + (targetRotation.y - prev.y) * 0.08,
      }));
      
      if (Math.abs(rotation.x - targetRotation.x) > 0.01 || 
          Math.abs(rotation.y - targetRotation.y) > 0.01) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetRotation]);

  return (
    <>
      <div className={`relative my-8 z-10 w-full max-w-md text-center flex flex-col items-center ${className}`}>
        <div 
          ref={iconRef}
          className="relative mb-8 group perspective-[1000px]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Glow effect */}
          <div className="glow-ring mb-8 group">
            <div className="absolute inset-0 bg blur-2xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-200" />
            
            {/* Icon container */}
            <div className={`
              ${sizeClasses[iconSize]} 
              glass-card w-48 h-48 
              rounded-full flex items-center justify-center
              transition-transform duration-300 ease-out
              relative border shadow-[0_20px_60px_-15px_var(--shadow-color)]
            `}
              style={{
                transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(10px)`,
                willChange: 'transform',
              }}
            >
              <span className="text-accent">{icon}</span>
              
              {/* Floating sub-icons */}
              <div className="absolute -top-2 -right-2 glass-card p-3 rounded-xl border animate-[bounce_3s_infinite]">
                <MdOutlineChat className=" w-9 h-9 text-tertiary" />
              </div>
              <div className="absolute bottom-4 -left-4 glass-card p-2 rounded-lg border animate-[pulse_3s_infinite]">
                <MdOutlineRestaurantMenu className="w-9 h-9 text-secondary" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Text content */}
          <h2 className="text-4xl font-headline-md text-secondary mb-2">
            {title}
          </h2>

          {/* Primary action */}
          {action && (
            <Link
              to={action.to}
              className="terracotta-gradient btn-shimmer text-button px-[clamp(1rem,2.5vw,2rem)] py-4 rounded-xl w-full
                hover:text-button hover:-translate-y-[1px] hover:shadow-primary-btn active:scale-95 transition-all duration-500
                md:w-auto tracking-widest flex items-center justify-center gap-2
                "
            >
              {action.icon} {action.label}
            </Link>
          )}
          <p className="text-md text-muted max-w-xs mx-auto">
            {description}
          </p>

          {/* Secondary action */}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="mt-4 font-label-md text-label-md text-text-secondary hover:text-accent transition-colors py-2 px-4 border-b border-transparent hover:border-accent/30"
            >
              {secondaryAction.label}
            </button>
          )}

        </div>
      </div>
    </>
  );
}

export default EmptyState;