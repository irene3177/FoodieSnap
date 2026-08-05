import React from 'react';
import { IoIosArrowDown } from 'react-icons/io';
interface ScrollToBottomButtonProps {
  onClick: () => void;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="
        fixed bottom-[100px] right-[30px] 
        w-11 h-11 
        rounded-full 
        bg-secondary text-accent
        border
        cursor-pointer 
        flex items-center justify-center 
        text-xl font-bold
        shadow-theme 
        transition-all duration-700 
        hover:bg-accent hover:text-white hover:scale-105 hover:shadow-theme-lg
        z-[100] 
        opacity-90 hover:opacity-100
        md:bottom-[80px] md:w-10 md:h-10 md:text-xl
      "
      onClick={onClick}
      aria-label="Scroll to bottom"
    >
      <IoIosArrowDown />
    </button>
  );
};