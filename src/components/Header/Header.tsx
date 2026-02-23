import { Link, NavLink } from 'react-router-dom';
import './Header.css';

function Header() {
  const getActiveClass = ({ isActive}: { isActive: boolean }): string => {
    return isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link';
  };
  return (
    <header className="header">
      <Link to="/" className="header__logo">🍳 FoodieSnap</Link>
      <nav className="header__nav">
        <ul className="header__nav-list">
          <li className="header__nav-item">
            <NavLink to="/" className={getActiveClass} end>
              Home 
            </NavLink>
          </li>
          <li className="header__nav-item">
            <NavLink to="/recipes" className={getActiveClass}>
              Recipes
            </NavLink>
          </li>
          <li className="header__nav-item">
            <NavLink to="/favorites" className={getActiveClass}>
              Favorites
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;