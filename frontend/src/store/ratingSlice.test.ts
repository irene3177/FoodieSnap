import { describe, it, expect } from 'vitest';
import ratingReducer, {
  clearRatings,
  clearError,
  fetchRecipeRating,
  fetchUserRatings,
  rateRecipe,
  deleteRating,
} from './ratingSlice';

// ---------- Test data ----------

const makeStats = (averageRating = 4.5, totalRatings = 10) => ({
  averageRating,
  totalRatings,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 8 } as {
    1: number; 2: number; 3: number; 4: number; 5: number;
  },
});

const makeState = (
  overrides: Partial<ReturnType<typeof ratingReducer>> = {}
) => ({
  stats: {},
  userRatings: {},
  loading: false,
  error: null,
  ...overrides,
});

// ---------- Tests ----------

describe('ratingSlice', () => {
  // ---- Sync reducers ----

  describe('sync reducers', () => {
    it('clearRatings resets stats and userRatings', () => {
      const state = makeState({
        stats: { 'recipe-1': makeStats() },
        userRatings: { 'recipe-1': 5 },
      });

      const next = ratingReducer(state, clearRatings());

      expect(next.stats).toEqual({});
      expect(next.userRatings).toEqual({});
    });

    it('clearError resets error to null', () => {
      const state = makeState({ error: 'something' });
      const next = ratingReducer(state, clearError());

      expect(next.error).toBeNull();
    });
  });

  // ---- fetchRecipeRating ----

  describe('fetchRecipeRating extra reducers', () => {
    it('pending sets loading=true and clears error', () => {
      const state = makeState({ error: 'old' });
      const next = ratingReducer(
        state,
        fetchRecipeRating.pending('req-id', 'recipe-1')
      );

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled stores stats by recipeId', () => {
      const stats = makeStats(4.2, 15);
      const state = makeState({ loading: true });

      const next = ratingReducer(
        state,
        fetchRecipeRating.fulfilled(
          { recipeId: 'recipe-1', stats },
          'req-id',
          'recipe-1'
        )
      );

      expect(next.loading).toBe(false);
      expect(next.stats['recipe-1']).toEqual(stats);
    });

    it('fulfilled keeps stats of other recipes', () => {
      const existing = makeStats(3.0, 5);
      const state = makeState({
        stats: { 'recipe-2': existing },
        loading: true,
      });

      const newStats = makeStats(4.5, 10);
      const next = ratingReducer(
        state,
        fetchRecipeRating.fulfilled(
          { recipeId: 'recipe-1', stats: newStats },
          'req-id',
          'recipe-1'
        )
      );

      expect(next.stats['recipe-1']).toEqual(newStats);
      expect(next.stats['recipe-2']).toEqual(existing);
    });

    it('rejected sets loading=false and stores error', () => {
      const state = makeState({ loading: true });
      const next = ratingReducer(
        state,
        fetchRecipeRating.rejected(null, 'req-id', 'recipe-1', 'Not found')
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Not found');
    });
  });

  // ---- fetchUserRatings ----

  describe('fetchUserRatings extra reducers', () => {
    it('pending sets loading=true', () => {
      const state = makeState();
      const next = ratingReducer(state, fetchUserRatings.pending('req-id'));

      expect(next.loading).toBe(true);
    });

    it('fulfilled replaces userRatings entirely', () => {
      const state = makeState({
        userRatings: { 'old-recipe': 3 },
        loading: true,
      });

      const newRatings = { 'recipe-1': 5, 'recipe-2': 4 };
      const next = ratingReducer(
        state,
        fetchUserRatings.fulfilled(newRatings, 'req-id')
      );

      expect(next.loading).toBe(false);
      expect(next.userRatings).toEqual(newRatings);
      expect(next.userRatings['old-recipe']).toBeUndefined();
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = ratingReducer(
        state,
        fetchUserRatings.rejected(null, 'req-id', undefined, 'Unauthorized')
      );

      expect(next.error).toBe('Unauthorized');
    });
  });

  // ---- rateRecipe ----

  describe('rateRecipe extra reducers', () => {
    it('pending sets loading=true and clears error', () => {
      const state = makeState({ error: 'old' });
      const next = ratingReducer(
        state,
        rateRecipe.pending('req-id', { recipeId: 'recipe-1', value: 5 })
      );

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled adds a new rating for the recipe', () => {
      const stats = makeStats(4.0, 1);
      const state = makeState({ loading: true });

      const next = ratingReducer(
        state,
        rateRecipe.fulfilled(
          { recipeId: 'recipe-1', value: 5, stats },
          'req-id',
          { recipeId: 'recipe-1', value: 5 }
        )
      );

      expect(next.loading).toBe(false);
      expect(next.userRatings['recipe-1']).toBe(5);
      expect(next.stats['recipe-1']).toEqual(stats);
    });

    it('fulfilled updates existing user rating', () => {
      const stats = makeStats(4.5, 2);
      const state = makeState({
        loading: true,
        userRatings: { 'recipe-1': 3 },
      });

      const next = ratingReducer(
        state,
        rateRecipe.fulfilled(
          { recipeId: 'recipe-1', value: 5, stats },
          'req-id',
          { recipeId: 'recipe-1', value: 5 }
        )
      );

      expect(next.userRatings['recipe-1']).toBe(5);
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = ratingReducer(
        state,
        rateRecipe.rejected(
          null,
          'req-id',
          { recipeId: 'recipe-1', value: 5 },
          'Invalid value'
        )
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Invalid value');
    });
  });

  // ---- deleteRating ----

  describe('deleteRating extra reducers', () => {
    it('pending sets loading=true and clears error', () => {
      const state = makeState({ error: 'old' });
      const next = ratingReducer(
        state,
        deleteRating.pending('req-id', 'recipe-1')
      );

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled removes user rating for the recipe', () => {
      const stats = makeStats(3.5, 0);
      const state = makeState({
        loading: true,
        userRatings: { 'recipe-1': 5, 'recipe-2': 4 },
      });

      const next = ratingReducer(
        state,
        deleteRating.fulfilled(
          { recipeId: 'recipe-1', stats },
          'req-id',
          'recipe-1'
        )
      );

      expect(next.userRatings['recipe-1']).toBeUndefined();
      expect(next.userRatings['recipe-2']).toBe(4);
    });

    it('fulfilled updates stats for the recipe', () => {
      const newStats = makeStats(3.0, 5);
      const state = makeState({
        loading: true,
        stats: { 'recipe-1': makeStats(4.0, 6) },
      });

      const next = ratingReducer(
        state,
        deleteRating.fulfilled(
          { recipeId: 'recipe-1', stats: newStats },
          'req-id',
          'recipe-1'
        )
      );

      expect(next.stats['recipe-1']).toEqual(newStats);
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = ratingReducer(
        state,
        deleteRating.rejected(null, 'req-id', 'recipe-1', 'Failed to delete')
      );

      expect(next.error).toBe('Failed to delete');
    });
  });
});