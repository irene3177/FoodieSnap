import { describe, it, expect } from 'vitest';
import usersReducer, {
  clearUsers,
  clearError,
  setPage,
  fetchUsers,
  searchUsers,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersTotal,
  selectUsersPage,
  selectUsersPages,
  selectSearchQuery,
} from './usersSlice';
import type { RootState } from './store';

// ---------- Test data ----------

const makeUser = (id: string, username: string) => ({
  _id: id,
  username,
  avatar: '',
  bio: '',
  recipeCount: 0,
  isFollowing: false,
});

const makeState = (
  overrides: Partial<ReturnType<typeof usersReducer>> = {}
) => ({
  users: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
  searchQuery: '',
  ...overrides,
});

const makeRootState = (
  usersState: ReturnType<typeof usersReducer>
): RootState => ({ users: usersState } as unknown as RootState);

// ---------- Tests ----------

describe('usersSlice', () => {
  // ---- Sync reducers ----

  describe('sync reducers', () => {
    it('clearUsers resets list, pagination and searchQuery', () => {
      const state = makeState({
        users: [makeUser('u1', 'alice')],
        total: 10,
        page: 3,
        pages: 5,
        searchQuery: 'ali',
      });

      const next = usersReducer(state, clearUsers());

      expect(next.users).toEqual([]);
      expect(next.total).toBe(0);
      expect(next.page).toBe(1);
      expect(next.pages).toBe(1);
      expect(next.searchQuery).toBe('');
    });

    it('clearError resets error to null', () => {
      const state = makeState({ error: 'Something failed' });
      const next = usersReducer(state, clearError());

      expect(next.error).toBeNull();
    });

    it('setPage updates page', () => {
      const state = makeState({ page: 1 });
      const next = usersReducer(state, setPage(3));

      expect(next.page).toBe(3);
    });
  });

  // ---- fetchUsers ----

  describe('fetchUsers extra reducers', () => {
    it('pending sets loading=true and clears error', () => {
      const state = makeState({ error: 'old' });
      const next = usersReducer(
        state,
        fetchUsers.pending('req-id', { page: 1, limit: 10 })
      );

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled stores users, pagination and resets searchQuery', () => {
      const payload = {
        users: [makeUser('u1', 'alice'), makeUser('u2', 'bob')],
        total: 2,
        page: 1,
        pages: 1,
      };

      const state = makeState({
        loading: true,
        searchQuery: 'old search',
      });

      const next = usersReducer(
        state,
        fetchUsers.fulfilled(payload, 'req-id', { page: 1, limit: 10 })
      );

      expect(next.loading).toBe(false);
      expect(next.users).toEqual(payload.users);
      expect(next.total).toBe(2);
      expect(next.page).toBe(1);
      expect(next.pages).toBe(1);
      // Important: fetchUsers clears searchQuery
      expect(next.searchQuery).toBe('');
    });

    it('rejected sets loading=false and stores error', () => {
      const state = makeState({ loading: true });
      const next = usersReducer(
        state,
        fetchUsers.rejected(null, 'req-id', { page: 1, limit: 10 }, 'Network error')
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Network error');
    });
  });

  // ---- searchUsers ----

  describe('searchUsers extra reducers', () => {
    it('pending sets loading=true and clears error', () => {
      const state = makeState({ error: 'old' });
      const next = usersReducer(
        state,
        searchUsers.pending('req-id', 'alice')
      );

      expect(next.loading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled stores users, pagination and searchQuery', () => {
      const payload = {
        users: [makeUser('u1', 'alice')],
        total: 1,
        page: 1,
        pages: 1,
        searchQuery: 'alice',
      };

      const state = makeState({ loading: true });

      const next = usersReducer(
        state,
        searchUsers.fulfilled(payload, 'req-id', 'alice')
      );

      expect(next.loading).toBe(false);
      expect(next.users).toEqual(payload.users);
      expect(next.total).toBe(1);
      expect(next.searchQuery).toBe('alice');
    });

    it('rejected sets loading=false and stores error', () => {
      const state = makeState({ loading: true });
      const next = usersReducer(
        state,
        searchUsers.rejected(null, 'req-id', 'alice', 'Search failed')
      );

      expect(next.loading).toBe(false);
      expect(next.error).toBe('Search failed');
    });
  });

  // ---- Selectors ----

  describe('selectors', () => {
    it('selectUsers returns users list', () => {
      const users = [makeUser('u1', 'alice')];
      const rootState = makeRootState(makeState({ users }));

      expect(selectUsers(rootState)).toEqual(users);
    });

    it('selectUsersLoading returns loading flag', () => {
      const rootState = makeRootState(makeState({ loading: true }));

      expect(selectUsersLoading(rootState)).toBe(true);
    });

    it('selectUsersError returns error', () => {
      const rootState = makeRootState(makeState({ error: 'Some error' }));

      expect(selectUsersError(rootState)).toBe('Some error');
    });

    it('selectUsersTotal returns total', () => {
      const rootState = makeRootState(makeState({ total: 42 }));

      expect(selectUsersTotal(rootState)).toBe(42);
    });

    it('selectUsersPage returns page', () => {
      const rootState = makeRootState(makeState({ page: 3 }));

      expect(selectUsersPage(rootState)).toBe(3);
    });

    it('selectUsersPages returns pages', () => {
      const rootState = makeRootState(makeState({ pages: 5 }));

      expect(selectUsersPages(rootState)).toBe(5);
    });

    it('selectSearchQuery returns searchQuery', () => {
      const rootState = makeRootState(makeState({ searchQuery: 'alice' }));

      expect(selectSearchQuery(rootState)).toBe('alice');
    });
  });
});