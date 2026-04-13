# FoodieSnap Frontend

React application for FoodieSnap - a social recipe sharing platform. Built with React 18, TypeScript, Redux Toolkit, and Socket.IO.

## 🚀 Live Demo

[Link to demo (to be added later)]

## 🚀 Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **UI Components**: Custom CSS Modules
- **Animations**: Framer Motion
- **Validation**: Custom validation
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## 🔧 Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Clone repository**

```bash
git clone https://github.com/irene3177/FoodieSnap.git
cd FoodieSnap/frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment file**

```bash
cp .env.example .env
```

4. **Start development server**

```bash
npm run dev
```

## 🎨 Features

### Authentication

- Login / Register with validation
- JWT stored in HTTP-only cookies
- Protected routes
- Profile management with avatar upload
- Password change
- Account deletion

### Recipe Management

- Browse recipes with infinite scroll
- Search recipes by name
- Filter by difficulty, cooking time, cuisine
- Create, edit, delete recipes
- Rate recipes (1-5 stars)
- Add to favorites with drag-and-drop reordering

### Social Features

- Follow / unfollow users
- View followers / following lists
- Like and comment on recipes
- Nested comment replies
- Real-time chat with typing indicators
- Online status indicators

### User Experience

- Responsive design (mobile, tablet, desktop)
- Dark/Light theme
- Loading skeletons
- Toast notifications
- Smooth animations with Framer Motion
- Infinite scrolling
- Drag-and-drop for favorites

## 📱 Pages & Components

### Public Pages

- **Home** (`/`) - Landing page with hero section
- **Recipes** (`/recipes`) - Browse all recipes
- **Search** (`/search`) - Advanced recipe search
- **Recipe Detail** (`/recipe/:id`) - Full recipe view
- **User Profile** (`/user/:id`) - View user profiles
- **Top Rated** (`/top-rated`) - Best rated recipes
- **NotFound** - 404 page

### Authenticated Pages

- **My Profile** (`/me`) - Personal profile with edit options
- **Favorites** (`/favorites`) - Saved recipes with drag-and-drop
- **Chats** (`/chats`) - Conversations list
- **Chat Detail** (`/chat/:id`) - Real-time messaging

### Reusable Components

- `RecipeCard` - Recipe preview card with hover actions
- `FavoriteButton` - Animated favorite button
- `RatingStars` - Interactive rating component
- `CommentSection` - Nested comments with likes
- `UserMenu` - User dropdown menu
- `MobileUserMenu` - Mobile navigation menu
- `FollowModal` - Followers/Following modal
- `MessageModal` - Start new conversation

### Toast Notifications

- Success (green)
- Error (red)
- Info (blue)
- Auto-dismiss after 3 seconds

### Accessibility

- **Keyboard Navigation** - Full keyboard support for all interactive elements
- **Screen Reader Compatible** - ARIA labels and semantic HTML
- **Focus Management** - Visible focus indicators for accessibility
- **Reduced Motion** - Respects user's motion preferences

## 🎯 Core Hooks

### Custom Hooks

| Hook | Description |
|------------|---------|
| `useAuth` | Authentication state and methods |
| `useFollow` | Follow/unfollow logic |
| `useProfileData` | User profile data fetching |
| `useChatMessages` | Real-time chat messages |
| `useChatScroll` | Auto-scroll for chat |
| `useInfiniteScroll` | Infinite scroll pagination |
| `useDebounce` | Debounced search input |
| `useUnreadListener` | Unread messages tracking |

## 🔌 API Integration

### Service Layer Structure

```typescript
// Example API service
export const recipesApi = {
  getRandomRecipes: (count: number) => 
    get<RandomRecipesResponse>('/recipes/random', { count }),
  
  searchRecipes: (query: string) => 
    get<SearchResponse>('/recipes/search', { q: query }),
  
  createRecipe: (data: NewRecipe) => 
    post<Recipe>('/recipes', data),
};
```

### Axios Interceptors

- Automatic token injection
- 401 Unauthorized handling
- Request/response logging
- Error transformation

## 🎨 Styling

- Component-scoped styles
- BEM naming convention
- CSS variables for theming
- Responsive breakpoints

### Theme Variables

```css
:root {
  /* Light theme (default) */
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --accent-primary: #764ba2;
  --accent-secondary: #667eea;
  --accent-hover: #5a3d7a;
  --border-color: #e0e0e0;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --error-bg: #fff3f3;
  --error-text: #d32f2f;
  --success-bg: #f0f9f0;
  --success-text: #2e7d32;
  --tag-bg: #f3e8ff;
  --tag-text: #764ba2;
  --header-bg: #ffffff;
  --footer-bg: #fafafa;
  --star-empty: #ddd;
  --star-filled: #ffc107;
  --star-user: #ff9800;
}
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- ProfilePage.test.tsx

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Open Vitest UI
npm run test:ui
```


### Environment Variables for Production

```env
VITE_API_URL=https://api.foodiesnap.com
VITE_WS_URL=https://foodiesnap.com
VITE_API_TIMEOUT=30000
```

## 📱 Responsive Breakpoints

| Device | Breakpoint | Features |
|------------|-------|------------|
| Mobile     | < 768px | Hamburger menu, single column |
| Tablet     | 768px - 1024px | 2-3 columns, adapted navigation |
| Desktop    | > 1024px | Full layout, hover effects |

## 🔒 Security Features

- **XSS Protection** - Input sanitization
- **CSRF Protection** - SameSite cookies
- **Authentication** - HTTP-only cookies
- **Route Protection** - Auth guards
- **Input Validation** - Client-side validation
- **Rate Limiting** - API request limits

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is for educational purposes.
