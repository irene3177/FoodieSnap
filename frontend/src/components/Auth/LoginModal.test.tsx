import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginModal from './LoginModal';
import authReducer from '../../store/authSlice';
import toastReducer from '../../store/toastSlice';

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      toast: toastReducer,
    },
  });
};

// Mock the auth hook - define at module level
const mockLogin = vi.fn();
const mockRefreshUser = vi.fn();
const mockClearError = vi.fn();

// Create a mutable object that we can update in tests
let mockIsLoading = false;
let mockError = null as string | null;

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    refreshUser: mockRefreshUser,
    clearError: mockClearError,
    isLoading: mockIsLoading,
    error: mockError,
  }),
}));

describe('LoginModal', () => {
  let store: ReturnType<typeof createTestStore>;
  let onCloseMock: VoidFunction;
  let onSwitchToRegisterMock: VoidFunction;

  beforeEach(() => {
    store = createTestStore();
    onCloseMock = vi.fn();
    onSwitchToRegisterMock = vi.fn();
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockLogin.mockReset();
    mockRefreshUser.mockReset();
    mockClearError.mockReset();
    
    // Reset loading and error states
    mockIsLoading = false;
    mockError = null;
    
    // Set default mock implementation
    mockLogin.mockResolvedValue({ success: true });
    mockRefreshUser.mockResolvedValue(undefined);
  });

  const renderModal = (isOpen: boolean = true) => {
    return render(
      <Provider store={store}>
        <LoginModal
          isOpen={isOpen}
          onClose={onCloseMock}
          onSwitchToRegister={onSwitchToRegisterMock}
        />
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderModal(false);
      expect(screen.queryByText('Welcome Back! 👋')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderModal(true);
      expect(screen.getByText('Welcome Back! 👋')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should have disabled submit button when loading', () => {
      // Set loading state
      mockIsLoading = true;
      
      renderModal(true);
      
      const submitButton = screen.getByRole('button', { name: /logging in/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form validation', () => {
    it('should require email input', () => {
      renderModal(true);
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should require password input', () => {
      renderModal(true);
      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should accept valid email format', () => {
      renderModal(true);
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Password visibility toggle', () => {
    it('should toggle password visibility when clicking eye icon', () => {
      renderModal(true);
      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = screen.getByRole('button', { name: /👁️/ });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form submission', () => {
    it('should call login with correct credentials when form is submitted', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });
      
      renderModal(true);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should call refreshUser after successful login', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });
      mockRefreshUser.mockResolvedValueOnce(undefined);
      
      renderModal(true);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalled();
      });
    });

    it('should close modal after successful login', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });
      mockRefreshUser.mockResolvedValueOnce(undefined);
      
      renderModal(true);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it('should show error message when login fails', async () => {
      // Set error state
      mockError = 'Invalid credentials';
      mockLogin.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' });
      
      renderModal(true);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Modal interactions', () => {
    it('should close modal when clicking on overlay', () => {
      renderModal(true);
      const overlay = screen.getByText('Welcome Back! 👋').closest('.auth-modal');
      if (overlay) {
        fireEvent.click(overlay);
      }
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('should close modal when clicking close button', () => {
      renderModal(true);
      const closeButton = screen.getByRole('button', { name: '×' });
      fireEvent.click(closeButton);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('Switch to register', () => {
    it('should call onSwitchToRegister when clicking sign up link', () => {
      renderModal(true);
      const signUpButton = screen.getByRole('button', { name: /sign up here/i });
      fireEvent.click(signUpButton);
      expect(onSwitchToRegisterMock).toHaveBeenCalled();
    });
  });
});