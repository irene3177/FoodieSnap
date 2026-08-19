import { useState } from 'react';
import { RecipesFilters as RecipeFiltersType } from '../../types';

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
    <div className="bg-secondary rounded-xl p-5">
      {/* Row 1: Main filters */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as RecipeFiltersType['difficulty'])}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-lg bg-primary text-text-primary text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Sort by</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as RecipeFiltersType['sort'])}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-lg bg-primary text-primary text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Min Rating</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-lg bg-primary text-primary text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Any</option>
            <option value="4">4★+</option>
            <option value="3">3★+</option>
            <option value="2">2★+</option>
            <option value="1">1★+</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as RecipeFiltersType['source'])}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-lg bg-primary text-primary text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">All</option>
            <option value="user">Users</option>
            <option value="theMealDB">TheMealDB</option>
          </select>
        </div>
      </div>

      {/* Row 2: Cooking time */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex-[1.5] min-w-[180px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Cooking Time (min)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              value={minCookingTime}
              onChange={(e) => setMinCookingTime(e.target.value ? Number(e.target.value) : undefined)}
              disabled={isLoading}
              className="flex-1 px-3 py-2 border rounded-lg bg-primary text-primary text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              min="0"
            />
            <span className="text-secondary text-sm">—</span>
            <input
              type="number"
              placeholder="Max"
              value={maxCookingTime}
              onChange={(e) => setMaxCookingTime(e.target.value ? Number(e.target.value) : undefined)}
              disabled={isLoading}
              className="flex-1 px-3 py-2 border rounded-lg bg-primary text-primary text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              min="0"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Min Rating Count</label>
          <input
            type="number"
            placeholder="e.g., 10"
            value={minRatingCount}
            onChange={(e) => setMinRatingCount(e.target.value ? Number(e.target.value) : undefined)}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-lg bg-primary text-primary text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            min="0"
          />
        </div>

        <div className="flex-[0.8] min-w-[120px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Media</label>
          <div className="flex gap-4 items-center h-9">
            <label className="flex items-center gap-1.5 cursor-pointer text-sm text-primary">
              <input
                type="checkbox"
                checked={hasVideo}
                onChange={(e) => setHasVideo(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 cursor-pointer"
              />
              <span>Video</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-sm text-primary">
              <input
                type="checkbox"
                checked={hasImage}
                onChange={(e) => setHasImage(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 cursor-pointer"
              />
              <span>Image</span>
            </label>
          </div>
        </div>
      </div>

      {/* Row 3: Text fields */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex-2 min-w-[160px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Category</label>
          <input
            type="text"
            placeholder="e.g., Dessert"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isLoading}
            className="input"
          />
        </div>

        <div className="flex-2 min-w-[160px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Cuisine</label>
          <input
            type="text"
            placeholder="e.g., Italian"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            disabled={isLoading}
            className="input"
          />
        </div>

        <div className="flex-2 min-w-[160px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">Tags</label>
          <input
            type="text"
            placeholder="vegetarian, spicy"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isLoading}
            className="input"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3 border-t">
        <button onClick={handleApply} disabled={isLoading} className="px-5 py-2 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent-hover hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          Apply Filters
        </button>
        <button onClick={handleReset} disabled={isLoading} className="px-5 py-2 bg-transparent text-secondary border rounded-lg font-medium text-sm hover:bg-border hover:text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          Reset All
        </button>
      </div>
    </div>
  );
};