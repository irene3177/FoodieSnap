import { describe, it, expect } from 'vitest';
import filtersReducer, { fetchFiltersData } from './filtersSlice';

// ---------- Test data ----------

const makeState = (
  overrides: Partial<ReturnType<typeof filtersReducer>> = {}
) => ({
  categories: [],
  tags: [],
  areas: [],
  loading: false,
  error: null,
  initialized: false,
  ...overrides,
});

// ---------- Tests ----------

describe('filtersSlice', () => {
  // ---- pending ----

  describe('fetchFiltersData.pending', () => {
    it('sets loading=true and clears error', () => {
      const state = makeState({ error: 'old error' });
      const next = filtersReducer(state, fetchFiltersData.pending('req-id'));

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('keeps initialized=false', () => {
      const state = makeState({ initialized: false });
      const next = filtersReducer(state, fetchFiltersData.pending('req-id'));

      expect(next.initialized).toBe(false);
    });
  });

  // ---- fulfilled ----

  describe('fetchFiltersData.fulfilled', () => {
    it('stores categories, tags and areas', () => {
      const state = makeState({ loading: true });

      const payload = {
        categories: ['Italian', 'Mexican'],
        tags: ['vegan', 'quick'],
        areas: ['Italy', 'Mexico'],
      };

      const next = filtersReducer(
        state,
        fetchFiltersData.fulfilled(payload, 'req-id')
      );

      expect(next.categories).toEqual(payload.categories);
      expect(next.tags).toEqual(payload.tags);
      expect(next.areas).toEqual(payload.areas);
    });

    it('sets loading=false and initialized=true', () => {
      const state = makeState({ loading: true, initialized: false });

      const next = filtersReducer(
        state,
        fetchFiltersData.fulfilled(
          { categories: [], tags: [], areas: [] },
          'req-id'
        )
      );

      expect(next.loading).toBe(false);
      expect(next.initialized).toBe(true);
    });

    it('replaces previously loaded data', () => {
      const state = makeState({
        categories: ['old-cat'],
        tags: ['old-tag'],
        areas: ['old-area'],
      });

      const next = filtersReducer(
        state,
        fetchFiltersData.fulfilled(
          { categories: ['new-cat'], tags: ['new-tag'], areas: ['new-area'] },
          'req-id'
        )
      );

      expect(next.categories).toEqual(['new-cat']);
      expect(next.tags).toEqual(['new-tag']);
      expect(next.areas).toEqual(['new-area']);
    });
  });

  // ---- rejected ----

  describe('fetchFiltersData.rejected', () => {
    it('sets loading=false and stores the error message', () => {
      const state = makeState({ loading: true });

      // Build a rejected action through the action creator
      const rejectedAction = fetchFiltersData.rejected(
        new Error('Network error'),
        'req-id',
        undefined,
        undefined
      );

      const next = filtersReducer(state, rejectedAction);

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Network error');
    });

    it('falls back to "Failed to load filters" when message is empty', () => {
      const rejectedAction = fetchFiltersData.rejected(
        new Error(''),
        'req-id',
        undefined,
        undefined
      );

      const state = makeState({ loading: true });
      const next = filtersReducer(state, rejectedAction);

      expect(next.error).toBe('Failed to load filters');
    });

    it('keeps initialized=false on error', () => {
      const state = makeState({ initialized: false });

      const rejectedAction = fetchFiltersData.rejected(
        new Error('fail'),
        'req-id',
        undefined,
        undefined
      );

      const next = filtersReducer(state, rejectedAction);

      expect(next.initialized).toBe(false);
    });
  });
});