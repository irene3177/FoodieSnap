import { useState } from 'react';
import { RecipesFilters as RecipeFiltersType } from '../../types';
import './RecipeFilters.css';

interface RecipeFiltersProps {
  onFilterChange: (filters: Partial<RecipeFiltersType>) => void;
  isLoading: boolean;
}

export const RecipeFilters = ({ onFilterChange, isLoading }: RecipeFiltersProps) => {
  // Main filters
  const [difficulty, setDifficulty] = useState<RecipeFiltersType['difficulty']>(undefined);
  const [maxCookingTime, setMaxCookingTime] = useState<number | undefined>(undefined);
  const [minCookingTime, setMinCookingTime] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<RecipeFiltersType['sort']>('newest');
  const [minRating, setMinRating] = useState<number| undefined>(undefined);
  const [category, setCategory] = useState<string>('');
  const [area, setArea] = useState<string>('');
  
  // Additional filters
  const [source, setSource] = useState<RecipeFiltersType['source']>(undefined);
  const [hasVideo, setHasVideo] = useState<boolean>(false);
  const [hasImage, setHasImage] = useState<boolean>(false);
  const [minRatingCount, setMinRatingCount] = useState<number| undefined>(undefined);
  const [tags, setTags] = useState<string>('');

  const handleApply = () => {
    const filters: Partial<RecipeFiltersType> = {};
    
    // Main filters
    if (difficulty) filters.difficulty = difficulty;
    if (maxCookingTime) filters.maxCookingTime = Number(maxCookingTime);
    if (minCookingTime) filters.minCookingTime = Number(minCookingTime);
    if (sort) filters.sort = sort;
    if (minRating) filters.minRating = Number(minRating);
    if (category) filters.category = category;
    if (area) filters.area = area;
    
    // Additional filters
    if (source) filters.source = source;
    if (hasVideo) filters.hasVideo = true;
    if (hasImage) filters.hasImage = true;
    if (minRatingCount) filters.minRatingCount = Number(minRatingCount);
    if (tags.trim()) {
      // Split by comma, trim each tag, filter out empty strings
      filters.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    onFilterChange(filters);
  };

  const handleReset = () => {
    // Reset main filters
    setDifficulty(undefined);
    setMaxCookingTime(undefined);
    setMinCookingTime(undefined);
    setSort('newest');
    setMinRating(undefined);
    setCategory('');
    setArea('');
    
    // Reset additional filters
    setSource(undefined);
    setHasVideo(false);
    setHasImage(false);
    setMinRatingCount(undefined);
    setTags('');
    
    onFilterChange({});
  };

  return (
    <div className="recipe-filters">
      {/* Первая строка: основные фильтры */}
      <div className="recipe-filters__row">
        <div className="recipe-filters__field">
          <label className="recipe-filters__label">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as RecipeFiltersType['difficulty'])}
            disabled={isLoading}
            className="recipe-filters__select"
          >
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="recipe-filters__field">
          <label className="recipe-filters__label">Sort by</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as RecipeFiltersType['sort'])}
            disabled={isLoading}
            className="recipe-filters__select"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        <div className="recipe-filters__field">
          <label className="recipe-filters__label">Min Rating</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
            disabled={isLoading}
            className="recipe-filters__select"
          >
            <option value="">Any</option>
            <option value="4">4★+</option>
            <option value="3">3★+</option>
            <option value="2">2★+</option>
            <option value="1">1★+</option>
          </select>
        </div>

        <div className="recipe-filters__field">
          <label className="recipe-filters__label">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as RecipeFiltersType['source'])}
            disabled={isLoading}
            className="recipe-filters__select"
          >
            <option value="">All</option>
            <option value="user">Users</option>
            <option value="theMealDB">TheMealDB</option>
          </select>
        </div>
      </div>

      {/* Вторая строка: время приготовления */}
      <div className="recipe-filters__row">
        <div className="recipe-filters__field recipe-filters__field--time">
          <label className="recipe-filters__label">Cooking Time (min)</label>
          <div className="recipe-filters__time-group">
            <input
              type="number"
              placeholder="Min"
              value={minCookingTime}
              onChange={(e) => setMinCookingTime(e.target.value ? Number(e.target.value) : undefined)}
              disabled={isLoading}
              className="recipe-filters__input"
              min="0"
            />
            <span className="recipe-filters__separator">—</span>
            <input
              type="number"
              placeholder="Max"
              value={maxCookingTime}
              onChange={(e) => setMaxCookingTime(e.target.value ? Number(e.target.value) : undefined)}
              disabled={isLoading}
              className="recipe-filters__input"
              min="0"
            />
          </div>
        </div>

        <div className="recipe-filters__field">
          <label className="recipe-filters__label">Min Rating Count</label>
          <input
            type="number"
            placeholder="e.g., 10"
            value={minRatingCount}
            onChange={(e) => setMinRatingCount(e.target.value ? Number(e.target.value) : undefined)}
            disabled={isLoading}
            className="recipe-filters__input"
            min="0"
          />
        </div>

        <div className="recipe-filters__field recipe-filters__field--checkbox">
          <label className="recipe-filters__label">Media</label>
          <div className="recipe-filters__checkbox-group">
            <label className="recipe-filters__checkbox">
              <input
                type="checkbox"
                checked={hasVideo}
                onChange={(e) => setHasVideo(e.target.checked)}
                disabled={isLoading}
              />
              <span>Video</span>
            </label>
            <label className="recipe-filters__checkbox">
              <input
                type="checkbox"
                checked={hasImage}
                onChange={(e) => setHasImage(e.target.checked)}
                disabled={isLoading}
              />
              <span>Image</span>
            </label>
          </div>
        </div>
      </div>

      {/* Третья строка: текстовые поля */}
      <div className="recipe-filters__row">
        <div className="recipe-filters__field recipe-filters__field--flex">
          <label className="recipe-filters__label">Category</label>
          <input
            type="text"
            placeholder="e.g., Dessert"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isLoading}
            className="recipe-filters__input"
          />
        </div>

        <div className="recipe-filters__field recipe-filters__field--flex">
          <label className="recipe-filters__label">Cuisine</label>
          <input
            type="text"
            placeholder="e.g., Italian"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            disabled={isLoading}
            className="recipe-filters__input"
          />
        </div>

        <div className="recipe-filters__field recipe-filters__field--flex">
          <label className="recipe-filters__label">Tags</label>
          <input
            type="text"
            placeholder="vegetarian, spicy"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isLoading}
            className="recipe-filters__input"
          />
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="recipe-filters__actions">
        <button onClick={handleApply} disabled={isLoading} className="recipe-filters__apply">
          Apply Filters
        </button>
        <button onClick={handleReset} disabled={isLoading} className="recipe-filters__reset">
          Reset All
        </button>
      </div>
    </div>
  );
};