// store/unreadSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { messagesApi } from '../services/messagesApi';
import { RootState } from './store';

interface UnreadState {
  counts: Record<string, number>; // conversationId -> count
  total: number;
  loading: boolean;
}

const initialState: UnreadState = {
  counts: {},
  total: 0,
  loading: false,
};

export const loadUnreadCounts = createAsyncThunk(
  'unread/loadCounts',
  async (userId: string,  { rejectWithValue }) => {
    const response = await messagesApi.getConversations();
    
    if (response.success && response.data) {
      const counts: Record<string, number> = {};
      let total = 0;
      
      response.data.forEach((conv) => {
        const unread = conv.unreadCount?.[userId] || 0;
        counts[conv._id] = unread;
        total += unread;
      });
      
      console.log('📊 loadUnreadCounts result:', { counts, total });
      return { counts, total };
    }
    
    return rejectWithValue(response.error || 'Failed to load unread counts');
  }
);

const unreadSlice = createSlice({
  name: 'unread',
  initialState,
  reducers: {
    incrementUnread: (state, action: PayloadAction<string>) => {
      const convId = action.payload;
      const oldCount = state.counts[convId] || 0;
      state.counts[convId] = oldCount + 1;
      state.total += 1;
      console.log('📊 Redux increment:', { convId, oldCount, newCount: state.counts[convId], total: state.total });
    },
    resetUnread: (state, action: PayloadAction<string>) => {
      const convId = action.payload;
      const oldCount = state.counts[convId] || 0;
      state.counts[convId] = 0;
      state.total = Math.max(0, state.total - oldCount);
      console.log('📊 Redux reset:', { convId, oldCount, newCount: 0, total: state.total });
    },
    resetAll: (state) => {
      state.counts = {};
      state.total = 0;
    },
    setUnread: (state, action: PayloadAction<{ convId: string; count: number }>) => {
      const { convId, count } = action.payload;
      const oldCount = state.counts[convId] || 0;
      state.counts[convId] = count;
      state.total = state.total - oldCount + count;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUnreadCounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUnreadCounts.fulfilled, (state, action) => {
        state.counts = action.payload.counts;
        state.total = action.payload.total;
        state.loading = false;
        console.log('📊 loadUnreadCounts.fulfilled:', action.payload);
      })
      .addCase(loadUnreadCounts.rejected, (state, action) => {
        state.loading = false;
        console.error('❌ loadUnreadCounts.rejected:', action.payload);
      });
  },
});

export const { incrementUnread, resetUnread, resetAll, setUnread } = unreadSlice.actions;

// Selectors
export const selectUnreadCount = (state: RootState) => state.unread.counts;
export const selectTotalUnread = (state: RootState) => state.unread.total;
export const selectUnreadLoading = (state: RootState) => state.unread.loading;
export const selectConversationUnread = (state: RootState, conversationId: string) => 
  state.unread.counts[conversationId] || 0;

export default unreadSlice.reducer;