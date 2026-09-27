import { useTheme } from '../../context/ThemeContext';
import { MdDarkMode, MdSunny } from 'react-icons/md';

function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative bg-transparent border-none cursor-pointer
        flex items-center justify-center"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative rounded-full py-1 px-1 border transition-colors hover:bg-border group-hover:border-accent hover:border-accent duration-1000 flex justify-between gap-4 items-center w-16 h-8">
        <div className={`
          absolute top-0.5 bottom-0.5 aspect-square bg-accent m-0.5 rounded-full transition-all duration-300 ease-in-out
          ${isDark ? 'translate-x-[calc(100%+0.5rem)]' : '-translate-x-0.5'}
        `} />
        <div className="relative z-10 flex items-center justify-between w-full text-lg transition-colors  duration-700">
          <MdSunny className={`ml-0.5 ${isDark ? 'text-muted' : 'text-button' }`} />
          <MdDarkMode className={`mr-0.5 ${isDark ? 'text-button' : 'text-muted' }`} />
        </div>
      </div>
    </button>
  );
}

export default ThemeToggle;