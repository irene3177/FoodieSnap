import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { hideToast, clearToast } from '../../store/toastSlice';
import Toast from './Toast';
import './Toast.css';

function GlobalToast() {
  const dispatch = useAppDispatch();
  const { message, type, isVisible } = useAppSelector(state => state.toast);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
        setTimeout(() => dispatch(clearToast()), 300); // ждем анимацию
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, dispatch]);

  if (!message || !isVisible) return null;

  return (
    <Toast
      message={message}
      type={type}
      onClose={() => {
        dispatch(hideToast());
        setTimeout(() => dispatch(clearToast()), 300);
      }}
    />
  );
}

export default GlobalToast;