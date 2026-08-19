import { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { RecipesFilters as RecipeFiltersType } from '../../types';
import { MdCheck, MdClose, MdExpandMore, MdFilterList, MdLocalOffer, MdOutlinePermMedia, MdOutlineRestaurant, MdPublic, MdSchedule, MdSort, MdStar, MdStarOutline } from 'react-icons/md';
import { DIFFICULTY_OPTIONS } from '../../constants';
import clsx from 'clsx';
import { TbCategoryPlus } from 'react-icons/tb';

interface RecipeFiltersProps {
  onFilterChange: (filters: Partial<RecipeFiltersType>) => void;
  isLoading: boolean;
  isOpen: boolean;
  onClose?: () => void;
  categories?: string[];
  tags?: string[];
  areas?: string[];
  filtersLoading?: boolean;
}

export const RecipeFilters = ({
  onFilterChange,
  isLoading,
  isOpen,
  onClose,
  categories = [],
  tags = [],
  areas = [],
  filtersLoading = false,
}: RecipeFiltersProps) => {
  // Main filters
  const [difficulty, setDifficulty] = useState<RecipeFiltersType['difficulty']>(undefined);
  const [sort, setSort] = useState<RecipeFiltersType['sort']>('newest');
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  
  // Additional filters
  const [hasVideo, setHasVideo] = useState<boolean>(false);
  const [hasImage, setHasImage] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [ratingHover, setRatingHover] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const [cookingTime, setCookingTime] = useState<number | undefined>(undefined);
  const maxTime = 180;

  useScrollLock(isOpen);

  const handleRatingClick = (value: number) => {
    if (selectedRating === value) {
      setSelectedRating(0);
    } else {
      setSelectedRating(value);
    }
  };

  const handleApply = () => {
    const filters: Partial<RecipeFiltersType> = {};
    
    // Main filters
    if (difficulty) filters.difficulty = difficulty;
    if (cookingTime !== undefined && cookingTime > 0) filters.maxCookingTime = cookingTime;
    if (sort) filters.sort = sort;
    if (selectedRating > 0) filters.minRating = selectedRating;
    if (selectedCategories) filters.categories = selectedCategories;
    if (selectedArea) filters.area = selectedArea;
    
    // Additional filters
    if (hasVideo) filters.hasVideo = true;
    if (hasImage) filters.hasImage = true;
    if (selectedTags) filters.tags = selectedTags;
    
    onFilterChange(filters);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const selectCuisine = (cuisine: string) => {
    if (selectedArea === cuisine) {
      setSelectedArea('');
    } else {
      setSelectedArea(cuisine);
    }
  };

  const handleReset = () => {
    // Reset main filters
    setDifficulty(undefined);
    setCookingTime(undefined);
    setSort('newest');
    setSelectedRating(0);
    setSelectedCategories([]);
    setSelectedArea('');
    
    // Reset additional filters
    setHasVideo(false);
    setHasImage(false);
    setSelectedTags([]);
    
    onFilterChange({});
  };

  const formatTime = (minutes: number | undefined): string => {
    if (minutes === undefined || minutes === 0) return '0m';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (

    <>
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'z-[1100] opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-full max-w-[428px]
          bg-primary rounded-l-2xl
          border-l border
          shadow-2xl
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'z-[1101] translate-x-0' : 'translate-x-full'}
        `}
      >
        <button className="absolute right-0 mr-8 mt-6 btn-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <MdClose className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b bg-primary flex-shrink-0">
          <div className="flex items-center gap-3">
            <MdFilterList className="text-accent text-3xl" />
            <h2 className="text-3xl font-semibold text-secondary m-0 cursor-default">Filters</h2>
          </div>
        </div>
        
        <div className="w-full bg-secondary rounded-b-xl overflow-y-auto scrollbar-thin">
          {/* Fields */}
          <div className="flex flex-col pt-4 px-8 space-y-6">
            {/* Sort By */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <MdSort className="text-accent text-xl" />
                <label className="block font-medium text-md text-muted">Sort by</label>
              </div>
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

            {/* Difficulty */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <MdOutlineRestaurant className="text-accent text-xl" />
                <label className="block font-medium text-md text-muted">Difficulty Level</label>
              </div>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map(item => {
                  const isActive = difficulty === item.value;
                  return (
                  <button
                    className={clsx(
                      "flex-1 py-2 px-3 rounded-lg border border-outline/20 text-secondary",
                      "hover:border-accent transition-all duration-500 italic",
                      {"border-accent bg-accent-secondary-bg": isActive}
                    )}
                    key={item.value}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setDifficulty(undefined);
                      } else {
                        setDifficulty(item.value)
                      }
                    }}
                  >{item.label}</button>
                );
              })}
              </div>
            </div>


            {/* Min Rating */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <MdStarOutline className="text-accent text-xl" />
                <label className="block font-medium text-md text-muted">Minimum Rating</label>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (ratingHover || selectedRating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      className={clsx(
                        "p-1 transition-all duration-200 rounded",
                        isFilled
                          ? "text-star-user scale-110"
                          : "text-border hover:text-accent"
                      )}
                    >
                      <MdStar className={clsx(
                        "w-6 h-6 transition-all duration-200",
                        isFilled && "drop-shadow-[0_0_4px_rgba(224,122,95,0.3)]"
                      )} />
                    </button>
                  );
                })}
                {selectedRating > 0 && (
                  <span className="ml-2 text-sm font-medium text-accent">
                    {selectedRating}+
                  </span>
                )}
              </div>
            </div>

            {/* Cooking time */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MdSchedule className="text-accent text-xl" />
                  <label className="block font-medium text-md text-muted">Cooking Time</label>
                </div>
                {cookingTime !== undefined && (
                  <span className="text-sm font-medium text-accent">
                    Up to {formatTime(cookingTime)}
                  </span>
                )}
              </div>
              <div className="pt-1">
                <input
                  type="range"
                  min="0"
                  max={maxTime}
                  step="5"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(Number(e.target.value))}
                  disabled={isLoading}
                  className="
                    w-full h-1.5 rounded-full appearance-none cursor-pointer
                    bg-border
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-accent
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-accent
                    [&::-moz-range-thumb]:border-none
                    [&::-moz-range-thumb]:cursor-pointer
                  "
                />
                <div className="flex justify-between text-xs text-secondary mt-1.5">
                  <span className="pl-2">5m</span>
                  <span className="pr-2">1h</span>
                  <span>2h</span>
                  <span className="pr-2">3h</span>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <MdOutlinePermMedia className="text-accent text-xl" />
                <label className="block font-medium text-md text-muted">Media</label>
              </div>
              <div className="flex gap-4 items-center h-9">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm text-secondary relative">
                  <input
                    type="checkbox"
                    checked={hasVideo}
                    onChange={(e) => setHasVideo(e.target.checked)}
                    disabled={isLoading}
                    className="checkbox-custom"
                  />
                  {hasVideo && <MdCheck className="absolute w-4 h-4 text-primary pointer-events-none left-0.4 top-0.4" />}
                  <span>Video</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm text-secondary relative">
                  <input
                    type="checkbox"
                    checked={hasImage}
                    onChange={(e) => setHasImage(e.target.checked)}
                    disabled={isLoading}
                    className="checkbox-custom"
                  />
                  {hasImage && <MdCheck className="absolute w-4 h-4 text-primary pointer-events-none left-0.4 top-0.4" />}
                  <span>Image</span>
                </label>
              </div>
            </div>

            {/* ===== CATEGORIES ===== */}
            <details className="group">
              <summary
                className="flex items-center justify-between  cursor-pointer hover:-translate-y-[1px]
                  transition-all duration-200 list-none select-none"
              >
                <div className="flex items-center gap-2">
                  <TbCategoryPlus className="text-accent text-xl" />
                  <span className="font-medium text-md text-muted">Categories</span>
                  {selectedCategories.length > 0 && (
                    <span className="text-xs terracotta-gradient text-button px-2 py-0.5 rounded-full">
                      {selectedCategories.length}
                    </span>
                  )}
                </div>
                <span className="text-secondary text-xl transition-transform duration-300 group-open:rotate-180">
                  <MdExpandMore />
                </span>
              </summary>
                <div className="p-4 space-y-1.5 animate-slide-down">
                  {filtersLoading ? (
                    <div className="text-sm text-muted py-2">Loading categories...</div>
                  ) : categories.length === 0 ? (
                    <div className="text-sm text-muted py-2">No categories available</div>
                  ) : (
                    categories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:text-accent transition-colors group relative"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="checkbox-custom"
                        />
                        {selectedCategories.includes(category) && (
                          <MdCheck className="absolute w-4 h-4 text-primary pointer-events-none left-0.6 top-0.6" />
                        )}
                        <span className="hover:text-accent transition-colors">{category}</span>
                      </label>
                    ))
                  )}
                </div>
            </details>

            {/* ===== TAGS ===== */}
            <details className="group">
              <summary
                className="flex items-center justify-between cursor-pointer hover:-translate-y-[1px] transition-all duration-200 list-none select-none"
              >
                <div className="flex items-center gap-2">
                  <MdLocalOffer className="text-accent text-xl" />
                  <span className="font-medium text-md text-muted">Tags</span>
                  {selectedTags.length > 0 && (
                    <span className="text-xs terracotta-gradient text-button px-2 py-0.5 rounded-full">
                      {selectedTags.length}
                    </span>
                  )}
                </div>
                <span className="text-secondary text-xl transition-transform duration-300 group-open:rotate-180">
                  <MdExpandMore />
                </span>
              </summary>
              
              <div className="p-4 space-y-1.5 animate-slide-down">
                {filtersLoading ? (
                  <div className="text-sm text-muted py-2">Loading tags...</div>
                ) : tags.length === 0 ? (
                  <div className="text-sm text-muted py-2">No tags available</div>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-accent transition-colors group relative"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="checkbox-custom"
                      />
                      {selectedTags.includes(tag) && (
                        <MdCheck className="absolute w-4 h-4 text-primary pointer-events-none left-0.6 top-0.6" />
                      )}
                      <span className="hover:text-accent transition-colors">{tag}</span>
                    </label>
                  ))
                )}
              </div>
            </details>

            {/* ===== CUISINES ===== */}
            <details className="group">
              <summary
                className="flex items-center justify-between  cursor-pointer hover:-translate-y-[1px]
                  transition-all duration-200 list-none select-none"
              >
                <div className="flex items-center gap-2">
                  <MdPublic className="text-accent text-xl" />
                  <span className="font-medium text-md text-muted">Cuisines</span>
                  {selectedArea && (
                    <span className="text-xs bg-accent text-button px-2 py-0.5 rounded-full">
                      1
                    </span>
                  )}
                </div>
                <span className="text-secondary text-xl transition-transform duration-300 group-open:rotate-180">
                  <MdExpandMore />
                </span>
              </summary>
              
              <div className="p-4 space-y-1.5">
                {/* "All" to Reset */}
                <label
                  className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:text-accent transition-colors group"
                >
                  <input
                    type="radio"
                    name="cuisine"
                    checked={selectedArea === ''}
                    onChange={() => setSelectedArea('')}
                    className="w-4 h-4 appearance-none rounded-full border-2 border-border bg-bg-secondary checked:border-accent checked:bg-accent transition-all duration-200 cursor-pointer relative focus:ring-2 focus:ring-accent/20"
                  />
                  <span className="group-hover:text-accent transition-colors font-medium">All Cuisines</span>
                </label>
                
                {filtersLoading ? (
                  <div className="text-sm text-muted py-2">Loading cuisines...</div>
                ) : areas.length === 0 ? (
                  <div className="text-sm text-muted py-2">No cuisines available</div>
                ) : (
                  areas.map((cuisine) => (
                    <label
                      key={cuisine}
                      className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-accent transition-colors group"
                    >
                      <input
                        type="radio"
                        name="cuisine"
                        checked={selectedArea === cuisine}
                        onChange={() => selectCuisine(cuisine)}
                        className="w-4 h-4 appearance-none rounded-full border-2 bg-secondary checked:border-accent checked:bg-accent transition-all duration-200 cursor-pointer relative"
                      />
                      <span className="hover:text-accent transition-colors">{cuisine}</span>
                    </label>
                  ))
                )}
              </div>
            </details>

            {/* */}
            {/* Actions */}
            <div className="flex gap-3 pt-3 bg-secondary border-t sticky bottom-0 pb-4">
              <button onClick={handleApply} disabled={isLoading} className="btn-primary">
                Apply Filters
              </button>
              <button onClick={handleReset} disabled={isLoading} className="btn-secondary">
                Reset All
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};