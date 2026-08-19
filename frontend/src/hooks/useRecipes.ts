import { useInfiniteQuery } from '@tanstack/react-query';
import { recipesApi } from '../services/recipesApi';

interface UseRecipesOptions {
  initialCount?: number;
  loadMoreCount?: number;
  enabled?: boolean;
} 

export const useRecipes = ({
  initialCount = 8,
  loadMoreCount = 6,
  enabled = true,
}: UseRecipesOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ['explore-recipes'],
    queryFn: async ({ pageParam = 1 }) => {
      const count = pageParam === 1 ? initialCount : loadMoreCount;
      const response = await recipesApi.getRandomRecipes(count, pageParam);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load recipes');
      }

      return {
        recipes: response.data?.recipes || [],
        page: pageParam,
        totalRecipes: response.data?.totalRecipes || 0,
        totalPages: response.data?.totalPages || 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};