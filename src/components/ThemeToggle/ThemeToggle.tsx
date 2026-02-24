import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
    className="theme-toggle"
    onClick={toggleTheme}
    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle__track">
        <div className={`theme-toggle__thumb ${theme}`}>
          {theme === 'light' ? '☀️' : '🌙'}
        </div>
      </div>
    </button>
  );
}

export default ThemeToggle;