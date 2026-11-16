import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa6';

interface ScrollToTopProps {
  threshold?: number;
  behavior?: 'auto' | 'smooth';
  showAfter?: number;
}

export const ScrollToTop = ({ 
  threshold = 300, 
  behavior = 'smooth',
  showAfter 
}: ScrollToTopProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const scrollThreshold = showAfter ?? threshold;

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > scrollThreshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [scrollThreshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: behavior
    });
  };

  if (!isVisible) return null;

  return (
    <button
      className="
        fixed rounded-full z-[100]
        bottom-[clamp(1rem,3vw,2rem)]
        right-[clamp(1rem,3vw,2rem)]
        w-[clamp(2.7rem,5vw,3rem)]
        h-[clamp(2.7rem,5vw,3rem)]
        bg-accent text-white
        border-none cursor-pointer
        flex items-center justify-center
        shadow-[0_4px_12px_rgba(0,0,0,0.15)]
        hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)]
        hover:scale-105 hover:bg-accent-hover
        active:scale-95
        transition-all duration-300
        opacity-90 hover:opacity-100
        animate-[fadeInUp_0.3s_ease-out]
      "
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <FaArrowUp className="
        w-[clamp(1.25rem,3vw,1.65rem)]
        h-[clamp(1.25rem,3vw,1.65rem)]
      " />
    </button>
  );
};