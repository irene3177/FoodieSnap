import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string | null;
  type: ToastType;
  isVisible: boolean;
}

const initialState: ToastState = {
  message: null,
  type: 'info',
  isVisible: false
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<{ message: string; type: ToastType }>) => {
      state.message = action.payload.message;
      state.type = action.payload.type;
      state.isVisible = true;
    },
    hideToast: (state) => {
      state.isVisible = false;
    },
    clearToast: (state) => {
      state.message = null;
      state.type = 'info';
      state.isVisible = false;
    }
  }
});

export const { showToast, hideToast, clearToast } = toastSlice.actions;
export default toastSlice.reducer;