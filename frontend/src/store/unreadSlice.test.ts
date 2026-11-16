import { describe, it, expect } from 'vitest';
import unreadReducer, {
  incrementUnread,
  resetUnread,
  resetAll,
  setUnread,
  updateLastMessage,
  loadUnreadCounts,
  selectUnreadCount,
  selectTotalUnread,
  selectUnreadLoading,
  selectConversationUnread,
  selectLastMessages,
} from './unreadSlice';
import type { RootState } from './store';

// ---------- Test data ----------

const makeState = (
  overrides: Partial<ReturnType<typeof unreadReducer>> = {}
) => ({
  counts: {},
  lastMessages: {},
  total: 0,
  loading: false,
  ...overrides,
});

const makeRootState = (
  unreadState: ReturnType<typeof unreadReducer>
): RootState => ({ unread: unreadState } as unknown as RootState);

// ---------- Tests ----------

describe('unreadSlice', () => {
  // ---- incrementUnread ----

  describe('incrementUnread', () => {
    it('increments existing count and total', () => {
      const state = makeState({
        counts: { 'conv-1': 2 },
        total: 2,
      });

      const next = unreadReducer(state, incrementUnread('conv-1'));

      expect(next.counts['conv-1']).toBe(3);
      expect(next.total).toBe(3);
    });

    it('starts from 0 for unknown conversation', () => {
      const state = makeState();

      const next = unreadReducer(state, incrementUnread('new-conv'));

      expect(next.counts['new-conv']).toBe(1);
      expect(next.total).toBe(1);
    });

    it('does not affect other conversations', () => {
      const state = makeState({
        counts: { 'conv-1': 2, 'conv-2': 5 },
        total: 7,
      });

      const next = unreadReducer(state, incrementUnread('conv-1'));

      expect(next.counts['conv-1']).toBe(3);
      expect(next.counts['conv-2']).toBe(5);
      expect(next.total).toBe(8);
    });
  });

  // ---- resetUnread ----

  describe('resetUnread', () => {
    it('resets count to 0 and decreases total', () => {
      const state = makeState({
        counts: { 'conv-1': 3, 'conv-2': 2 },
        total: 5,
      });

      const next = unreadReducer(state, resetUnread('conv-1'));

      expect(next.counts['conv-1']).toBe(0);
      expect(next.total).toBe(2);
    });

    it('handles resetting a conversation that was already 0', () => {
      const state = makeState({
        counts: { 'conv-1': 0 },
        total: 5,
      });

      const next = unreadReducer(state, resetUnread('conv-1'));

      expect(next.counts['conv-1']).toBe(0);
      // total unchanged because oldCount was 0
      expect(next.total).toBe(5);
    });

    it('does not allow total to go below zero', () => {
      const state = makeState({
        counts: { 'conv-1': 3 },
        total: 1, // inconsistent, but test the Math.max guard
      });

      const next = unreadReducer(state, resetUnread('conv-1'));

      expect(next.counts['conv-1']).toBe(0);
      expect(next.total).toBe(0);
    });

    it('handles unknown conversation (oldCount = 0)', () => {
      const state = makeState({ total: 5 });

      const next = unreadReducer(state, resetUnread('missing'));

      expect(next.counts['missing']).toBe(0);
      expect(next.total).toBe(5);
    });
  });

  // ---- resetAll ----

  describe('resetAll', () => {
    it('clears counts and sets total to 0', () => {
      const state = makeState({
        counts: { 'conv-1': 3, 'conv-2': 2 },
        total: 5,
        lastMessages: { 'conv-1': { text: 'hi', createdAt: '', senderId: '' } },
      });

      const next = unreadReducer(state, resetAll());

      expect(next.counts).toEqual({});
      expect(next.total).toBe(0);
      // lastMessages untouched
      expect(next.lastMessages['conv-1']).toBeDefined();
    });
  });

  // ---- setUnread ----

  describe('setUnread', () => {
    it('sets a count and adjusts total correctly', () => {
      const state = makeState({
        counts: { 'conv-1': 2 },
        total: 5,
      });

      const next = unreadReducer(
        state,
        setUnread({ convId: 'conv-1', count: 7 })
      );

      // total: 5 - 2 (old) + 7 (new) = 10
      expect(next.counts['conv-1']).toBe(7);
      expect(next.total).toBe(10);
    });

    it('works for a new conversation', () => {
      const state = makeState({ total: 5 });

      const next = unreadReducer(
        state,
        setUnread({ convId: 'new-conv', count: 3 })
      );

      expect(next.counts['new-conv']).toBe(3);
      expect(next.total).toBe(8);
    });

    it('sets count to 0 correctly', () => {
      const state = makeState({
        counts: { 'conv-1': 5 },
        total: 5,
      });

      const next = unreadReducer(
        state,
        setUnread({ convId: 'conv-1', count: 0 })
      );

      expect(next.counts['conv-1']).toBe(0);
      expect(next.total).toBe(0);
    });
  });

  // ---- updateLastMessage ----

  describe('updateLastMessage', () => {
    it('stores last message for a conversation', () => {
      const state = makeState();

      const next = unreadReducer(
        state,
        updateLastMessage({
          conversationId: 'conv-1',
          text: 'Hello',
          createdAt: '2024-01-01',
          senderId: 'user-1',
        })
      );

      expect(next.lastMessages['conv-1']).toEqual({
        text: 'Hello',
        createdAt: '2024-01-01',
        senderId: 'user-1',
      });
    });

    it('overwrites existing last message', () => {
      const state = makeState({
        lastMessages: {
          'conv-1': { text: 'old', createdAt: '2024-01-01', senderId: 'user-2' },
        },
      });

      const next = unreadReducer(
        state,
        updateLastMessage({
          conversationId: 'conv-1',
          text: 'new',
          createdAt: '2024-01-02',
          senderId: 'user-1',
        })
      );

      expect(next.lastMessages['conv-1'].text).toBe('new');
      expect(next.lastMessages['conv-1'].senderId).toBe('user-1');
    });
  });

  // ---- loadUnreadCounts ----

  describe('loadUnreadCounts extra reducers', () => {
    it('pending sets loading=true', () => {
      const state = makeState();
      const next = unreadReducer(
        state,
        loadUnreadCounts.pending('req-id', 'user-1')
      );

      expect(next.loading).toBe(true);
    });

    it('fulfilled replaces counts and total', () => {
      const state = makeState({
        loading: true,
        counts: { 'old-conv': 3 },
        total: 3,
      });

      const next = unreadReducer(
        state,
        loadUnreadCounts.fulfilled(
          { counts: { 'conv-1': 2, 'conv-2': 5 }, total: 7 },
          'req-id',
          'user-1'
        )
      );

      expect(next.loading).toBe(false);
      expect(next.counts).toEqual({ 'conv-1': 2, 'conv-2': 5 });
      expect(next.total).toBe(7);
      expect(next.counts['old-conv']).toBeUndefined();
    });

    it('rejected sets loading=false without changing counts', () => {
      const state = makeState({
        loading: true,
        counts: { 'conv-1': 2 },
        total: 2,
      });

      const next = unreadReducer(
        state,
        loadUnreadCounts.rejected(null, 'req-id', 'user-1', 'Network error')
      );

      expect(next.loading).toBe(false);
      expect(next.counts).toEqual({ 'conv-1': 2 });
      expect(next.total).toBe(2);
    });
  });

  // ---- Selectors ----

  describe('selectors', () => {
    it('selectUnreadCount returns counts map', () => {
      const rootState = makeRootState(makeState({ counts: { 'conv-1': 3 } }));

      expect(selectUnreadCount(rootState)).toEqual({ 'conv-1': 3 });
    });

    it('selectTotalUnread returns total', () => {
      const rootState = makeRootState(makeState({ total: 7 }));

      expect(selectTotalUnread(rootState)).toBe(7);
    });

    it('selectUnreadLoading returns loading flag', () => {
      const rootState = makeRootState(makeState({ loading: true }));

      expect(selectUnreadLoading(rootState)).toBe(true);
    });

    it('selectConversationUnread returns count for the conversation', () => {
      const rootState = makeRootState(makeState({
        counts: { 'conv-1': 3, 'conv-2': 5 },
      }));

      expect(selectConversationUnread(rootState, 'conv-1')).toBe(3);
      expect(selectConversationUnread(rootState, 'conv-2')).toBe(5);
    });

    it('selectConversationUnread returns 0 for unknown conversation', () => {
      const rootState = makeRootState(makeState({ counts: {} }));

      expect(selectConversationUnread(rootState, 'missing')).toBe(0);
    });

    it('selectLastMessages returns lastMessages map', () => {
      const lastMessages = {
        'conv-1': { text: 'hi', createdAt: '2024-01-01', senderId: 'u1' },
      };
      const rootState = makeRootState(makeState({ lastMessages }));

      expect(selectLastMessages(rootState)).toEqual(lastMessages);
    });
  });
});