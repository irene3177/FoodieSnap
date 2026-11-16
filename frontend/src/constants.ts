import { MdOutlineExplore, MdSearch, MdOutlineStarBorder, MdPeopleAlt, MdPersonOutline, MdMailOutline, MdBookmarkBorder } from 'react-icons/md';

// Navigation Links for the NavBar
export const NavLinks = [
  { path: '/recipes', label: 'Explore', icon: MdOutlineExplore },
  { path: '/search', label: 'Search', icon: MdSearch },
  { path: '/top-rated', label: 'Top Rated', icon: MdOutlineStarBorder },
  { path: '/users', label: 'Community', icon: MdPeopleAlt },
] as const;

// Links for User Menu
export const PersonalLinks = [
  { path: '/me', label: 'My Profile', icon: MdPersonOutline },
  { path: '/chats', label: 'Messages', icon: MdMailOutline },
  { path: '/favorites', label: 'Saved Recipes', icon: MdBookmarkBorder },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;