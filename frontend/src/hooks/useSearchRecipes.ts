import { useInfiniteQuery } from '@tanstack/react-query';
import { recipesApi } from '../services/recipesApi';
import { RecipesFilters } from '../types';

interface UseSearchRecipesOptions {
  searchQuery?: string;
  filters?: RecipesFilters;
  enabled?: boolean;
}

export const useSearchRecipes = ({
  searchQuery = '',
  filters = {},
  enabled = true,
}: UseSearchRecipesOptions = {}) => {
  const shouldFetch = enabled;

  return useInfiniteQuery({
    queryKey: ['search-recipes', searchQuery, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const allFilters: RecipesFilters = {
        ...filters,
        ...(searchQuery.trim() && { search: searchQuery.trim() })
      };

      const hasNoFilters = !searchQuery.trim() && Object.keys(filters).length === 0;

      if (hasNoFilters) {
        const response = await recipesApi.filterRecipes(
          { sort: 'newest' }, 
          pageParam, 
          12
        );
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to load recipes');
        }

        return {
          recipes: response.data?.recipes || [],
          page: pageParam,
          total: response.data?.pagination.total || 0,
          pages: response.data?.pagination.pages || 1,
          limit: response.data?.pagination.limit || 12,
        };
      }

      const response = await recipesApi.filterRecipes(allFilters, pageParam, 12);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load recipes');
      }

      return {
        recipes: response.data?.recipes || [],
        page: pageParam,
        total: response.data?.pagination.total || 0,
        pages: response.data?.pagination.pages || 1,
        limit: response.data?.pagination.limit || 12,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
};