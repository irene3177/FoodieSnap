import { Recipe } from "../types/recipe.types";

export const recipes: Recipe[] = [
  {
    id: 1,
    title: 'Classic Pancakes',
    description: 'Fluffy, soft, and delicious breakfast pancakes.',
    image: 'https://bromabakery.com/wp-content/uploads/2020/07/Perfect-Chocolate-Chip-Pancakes-4.jpg',
    ingredients: ['Flour', 'Milk', 'Eggs', 'Sugar', 'Baking Powder']
  },
  {
    id: 2,
    title: 'Caesar Salad',
    description: 'Fresh romaine lettuce with creamy Caesar dressing and croutons.',
    image: 'https://www.maggi.co.uk/sites/default/files/srh_recipes/3ee1954a36009dd59be2d362a2a44cf6.jpg',
    ingredients: ['Lettuce', 'Chicken', 'Parmesan', 'Croutons', 'Caesar Dressing']
  },
  {
    id: 3,
    title: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with eggs, cheese, pancetta, and pepper.',
    image: 'https://ineveskitchen.com/wp-content/uploads/2024/05/Spaghetti-carbonara-1.jpg',
    ingredients: ['Spaghetti', 'Eggs', 'Pancetta', 'Pecorino Cheese', 'Black Pepper']
  }
];