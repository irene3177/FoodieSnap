# FoodieSnap 🍳

FoodieSnap is a web application for discovering and saving recipes from around the world. Built with React and TypeScript, integrating TheMealDB API.

## 🚀 Live Demo

[Link to demo (to be added later)]

## ✨ Features

- 🔍 Search recipes by name
- 📂 Filter by categories (Beef, Chicken, Dessert, etc.)
- 🔀 Random recipe generator
- ⭐ Save favorites to local storage
- 📱 Fully responsive design
- ⌨️ Keyboard accessible
- ♿ ARIA labels for screen readers

## 🛠 Built With

- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router v7** - Navigation
- **Axios** - HTTP requests
- **Vite** - Build tool and dev server
- **CSS (BEM methodology)** - Styling

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