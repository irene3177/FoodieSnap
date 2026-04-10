import { useState, useEffect } from 'react';
import './ScrollToTop.css';

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
      className="scroll-to-top"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <svg
        className="scroll-to-top__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
};