# FoodieSnap 🍳

FoodieSnap is a web application for discovering and saving recipes from around the world. Built with React and TypeScript, integrating TheMealDB API.

## 🚀 Live Demo

[Link to demo (to be added later)]

## ✨ Key Features

### 🎨 User Experience
- **Dual Theme Support** - Seamless switching between light and dark modes with persistent preference
- **Real-time Search** - Debounced search with instant results as you type
- **Smooth Animations** - Page transitions and micro-interactions for a polished feel
- **Toast Notifications** - Non-intrusive feedback for all user actions
- **Fully Responsive** - Perfect experience on desktop, tablet, and mobile

### ❤️ Favorites System
- **Persistent Storage** - Favorites automatically saved to browser's localStorage
- **Global State** - Favorites accessible from any page with Context API
- **One-click Save** - Quick toggle from recipe cards and detail pages
- **Bulk Management** - Clear all favorites with a single click

### ♿ Accessibility
- **Keyboard Navigation** - Full keyboard support for all interactive elements
- **Screen Reader Compatible** - ARIA labels and semantic HTML
- **Focus Management** - Visible focus indicators for accessibility
- **Reduced Motion** - Respects user's motion preferences


## 🛠 Technology Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library with hooks and functional components |
| **TypeScript** | 5.0+ | Type safety and better developer experience |
| **Vite** | 4.0+ | Lightning-fast build tool and dev server |

### State Management
| Technology | Purpose |
|------------|---------|
| **Context API** | Global state management for favorites |
| **useReducer** | Complex state transitions with predictable updates |
| **localStorage** | Persistent storage for user preferences and favorites |

### Routing & Data Fetching
| Technology | Purpose |
|------------|---------|
| **React Router v7** | Client-side routing with nested routes |
| **Axios** | HTTP client with interceptors and error handling |
| **TheMealDB API** | Free recipe database with 300+ recipes |

### Styling & Animations
| Technology | Purpose |
|------------|---------|
| **CSS Modules** | Scoped styling with BEM methodology |
| **CSS Variables** | Dynamic theme switching |
| **Framer Motion** | Smooth page transitions and animations |

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/irene3177/foodiesnap.git
cd foodiesnap
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🎯 Pages Overview

| Page | Description |
|------|-------------|
| **Home** | Landing page with hero section and random recipe |
| **Recipes** | Search and filter recipes by category |
| **Recipe Detail** | Full recipe with ingredients and instructions |
| **Favorites** | Saved recipes (persisted in localStorage) |


## 🔌 API Integration

This project uses [TheMealDB API](https://www.themealdb.com/api.php) - a free recipe database.

Endpoints used:
- `GET /search.php?s={query}` - Search recipes
- `GET /filter.php?c={category}` - Filter by category
- `GET /lookup.php?i={id}` - Get recipe details
- `GET /random.php` - Get random recipe
- `GET /categories.php` - Get all categories

## 🚀 Deployment

Build for production:
```bash
npm run build
```

The built files will be in the `dist` folder, ready to deploy to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting


## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://www.themealdb.com/api/json/v1/1
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is for educational purposes.