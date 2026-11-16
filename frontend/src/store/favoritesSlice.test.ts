import { describe, it, expect } from 'vitest';
import favoritesReducer, {
  clearFavorites,
  setError,
  setFavoritesOrder,
  fetchFavorites,
  addToFavorites,
  removeFromFavorites,
  reorderFavorites,
  clearAllFavorites,
} from './favoritesSlice';
import type { Recipe } from '@/types';

// ---------- Test data ----------

const makeRecipe = (id: string, title: string): Recipe => ({
  _id: id,
  title,
  description: '',
  ingredients: [],
  instructions: [],
  imageUrl: '',
  difficulty: 'easy',
  rating: 0,
  ratingCount: 0,
  source: 'user',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

const makeState = (
  overrides: Partial<ReturnType<typeof favoritesReducer>> = {}
) => ({
  items: [],
  loading: false,
  error: null,
  initialized: false,
  ...overrides,
});

// ---------- Tests ----------

describe('favoritesSlice', () => {
  // ---- Sync reducers ----

  describe('sync reducers', () => {
    it('clearFavorites resets items and initialized', () => {
      const state = makeState({
        items: [makeRecipe('r1', 'Pizza')],
        initialized: true,
      });

      const next = favoritesReducer(state, clearFavorites());

      expect(next.items).toEqual([]);
      expect(next.initialized).toBe(false);
    });

    it('setError sets error to a message', () => {
      const state = makeState();
      const next = favoritesReducer(state, setError('Something failed'));

      expect(next.error).toBe('Something failed');
    });

    it('setError with null clears error', () => {
      const state = makeState({ error: 'old error' });
      const next = favoritesReducer(state, setError(null));

      expect(next.error).toBeNull();
    });

    it('setFavoritesOrder replaces items', () => {
      const items = [makeRecipe('r2', 'Pasta'), makeRecipe('r1', 'Pizza')];
      const state = makeState();

      const next = favoritesReducer(state, setFavoritesOrder(items));

      expect(next.items).toEqual(items);
    });
  });

  // ---- fetchFavorites ----

  describe('fetchFavorites extra reducers', () => {
    it('pending sets loading=true and clears error', () => {
      const state = makeState({ error: 'old' });
      const next = favoritesReducer(
        state,
        fetchFavorites.pending('req-id')
      );

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled sets items, loading=false and initialized=true', () => {
      const items = [makeRecipe('r1', 'Pizza')];
      const state = makeState({ loading: true });

      const next = favoritesReducer(
        state,
        fetchFavorites.fulfilled(items, 'req-id')
      );

      expect(next.loading).toBe(false);
      expect(next.items).toEqual(items);
      expect(next.initialized).toBe(true);
    });

    it('rejected sets error, loading=false and initialized=true', () => {
      const state = makeState({ loading: true });
      const next = favoritesReducer(
        state,
        fetchFavorites.rejected(null, 'req-id', undefined, 'Network error')
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Network error');
      expect(next.initialized).toBe(true);
    });
  });

  // ---- addToFavorites ----

  describe('addToFavorites extra reducers', () => {
    it('pending sets loading=true', () => {
      const state = makeState();
      const next = favoritesReducer(
        state,
        addToFavorites.pending('req-id', makeRecipe('r1', 'Pizza'))
      );

      expect(next.loading).toBe(true);
    });

    it('fulfilled sets loading=false without touching items', () => {
      const items = [makeRecipe('r1', 'Pizza')];
      const state = makeState({ loading: true, items });

      const next = favoritesReducer(
        state,
        addToFavorites.fulfilled(makeRecipe('r2', 'Pasta'), 'req-id', makeRecipe('r2', 'Pasta'))
      );

      expect(next.loading).toBe(false);
      // items are refreshed via a nested fetchFavorites dispatch
      expect(next.items).toEqual(items);
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = favoritesReducer(
        state,
        addToFavorites.rejected(
          null,
          'req-id',
          makeRecipe('r1', 'Pizza'),
          'Failed to add'
        )
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Failed to add');
    });
  });

  // ---- removeFromFavorites ----

  describe('removeFromFavorites extra reducers', () => {
    it('pending sets loading=true', () => {
      const state = makeState();
      const next = favoritesReducer(
        state,
        removeFromFavorites.pending('req-id', 'r1')
      );

      expect(next.loading).toBe(true);
    });

    it('fulfilled sets loading=false', () => {
      const state = makeState({ loading: true });
      const next = favoritesReducer(
        state,
        removeFromFavorites.fulfilled('r1', 'req-id', 'r1')
      );

      expect(next.loading).toBe(false);
    });

    it('rejected sets error', () => {
      const state = makeState({ loading: true });
      const next = favoritesReducer(
        state,
        removeFromFavorites.rejected(null, 'req-id', 'r1', 'Cannot remove')
      );

      expect(next.error).toBe('Cannot remove');
    });
  });

  // ---- reorderFavorites ----

  describe('reorderFavorites extra reducers', () => {
    it('pending sets loading=true', () => {
      const state = makeState();
      const next = favoritesReducer(
        state,
        reorderFavorites.pending('req-id', [])
      );

      expect(next.loading).toBe(true);
    });

    it('fulfilled replaces items with reordered array', () => {
      const original = [makeRecipe('r1', 'Pizza'), makeRecipe('r2', 'Pasta')];
      const reordered = [makeRecipe('r2', 'Pasta'), makeRecipe('r1', 'Pizza')];

      const state = makeState({ loading: true, items: original });

      const next = favoritesReducer(
        state,
        reorderFavorites.fulfilled(reordered, 'req-id', reordered)
      );

      expect(next.loading).toBe(false);
      expect(next.items).toEqual(reordered);
    });

    it('rejected keeps existing items and sets error', () => {
      const original = [makeRecipe('r1', 'Pizza')];
      const state = makeState({ loading: true, items: original });

      const next = favoritesReducer(
        state,
        reorderFavorites.rejected(null, 'req-id', [], 'Failed to reorder')
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Failed to reorder');
      expect(next.items).toEqual(original);
    });
  });

  // ---- clearAllFavorites ----

  describe('clearAllFavorites extra reducers', () => {
    it('has no extraReducer wired up (state unchanged)', () => {

      const state = makeState({
        loading: false,
        items: [makeRecipe('r1', 'Pizza')],
        initialized: true,
      });

      const next = favoritesReducer(
        state,
        clearAllFavorites.fulfilled(undefined, 'req-id')
      );

      // State should be unchanged because there is no matching case
      expect(next).toEqual(state);
    });

    it('pending is not wired up either', () => {
      const state = makeState({
        loading: false,
        items: [makeRecipe('r1', 'Pizza')],
      });

      const next = favoritesReducer(
        state,
        clearAllFavorites.pending('req-id')
      );

      expect(next).toEqual(state);
    });
  });
});