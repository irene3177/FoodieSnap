import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RegisterModal from './RegisterModal';
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

// Mock the auth hook
const mockRegister = vi.fn();
const mockRefreshUser = vi.fn();
const mockClearError = vi.fn();

// Mutable state for mocks
let mockIsLoading = false;
let mockError = null as string | null;

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    refreshUser: mockRefreshUser,
    clearError: mockClearError,
    isLoading: mockIsLoading,
    error: mockError,
  }),
}));

describe('RegisterModal', () => {
  let store: ReturnType<typeof createTestStore>;
  let onCloseMock: VoidFunction;
  let onSwitchToLoginMock: VoidFunction;

  beforeEach(() => {
    store = createTestStore();
    onCloseMock = vi.fn();
    onSwitchToLoginMock = vi.fn();
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockRegister.mockReset();
    mockRefreshUser.mockReset();
    mockClearError.mockReset();
    
    // Reset loading and error states
    mockIsLoading = false;
    mockError = null;
    
    // Set default mock implementation
    mockRegister.mockResolvedValue({ success: true });
    mockRefreshUser.mockResolvedValue(undefined);
  });

  const renderModal = (isOpen: boolean = true) => {
    return render(
      <Provider store={store}>
        <RegisterModal
          isOpen={isOpen}
          onClose={onCloseMock}
          onSwitchToLogin={onSwitchToLoginMock}
        />
      </Provider>
    );
  };

  // Helper to get password input (no label, so use getByPlaceholderText)
  const getPasswordInput = () => screen.getByPlaceholderText('••••••••');

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderModal(false);
      expect(screen.queryByText('Join FoodieSnap! 🍳')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderModal(true);
      expect(screen.getByText('Join FoodieSnap! 🍳')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByLabelText('Bio (optional)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should have disabled submit button when loading', () => {
      mockIsLoading = true;
      
      renderModal(true);
      
      const submitButton = screen.getByRole('button', { name: /creating account/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form validation', () => {
    it('should require username input', () => {
      renderModal(true);
      const usernameInput = screen.getByLabelText('Username');
      expect(usernameInput).toHaveAttribute('required');
    });

    it('should require email input', () => {
      renderModal(true);
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should require password input', () => {
      renderModal(true);
      const passwordInput = getPasswordInput();
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should not call register when username is too short', async () => {
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'ab' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('should not call register when password is too short', async () => {
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '12345' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('should accept valid form inputs', () => {
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(usernameInput).toHaveValue('testuser');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Password visibility toggle', () => {
    it('should toggle password visibility when clicking eye icon', () => {
      renderModal(true);
      const passwordInput = getPasswordInput();
      const toggleButton = screen.getByRole('button', { name: /👁️/ });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Bio field', () => {
    it('should accept bio input', () => {
      renderModal(true);
      const bioInput = screen.getByLabelText('Bio (optional)');
      
      fireEvent.change(bioInput, { target: { value: 'I love cooking!' } });
      expect(bioInput).toHaveValue('I love cooking!');
    });

    it('should handle empty bio', () => {
      renderModal(true);
      const bioInput = screen.getByLabelText('Bio (optional)');
      expect(bioInput).toHaveValue('');
    });
  });

  describe('Form submission', () => {
    it('should call register with correct credentials when form is submitted', async () => {
      mockRegister.mockResolvedValueOnce({ success: true });
      
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          bio: undefined,
        });
      });
    });

    it('should call register with bio when provided', async () => {
      mockRegister.mockResolvedValueOnce({ success: true });
      
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();
      const bioInput = screen.getByLabelText('Bio (optional)');
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(bioInput, { target: { value: 'Food lover!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          bio: 'Food lover!',
        });
      });
    });

    it('should call refreshUser after successful registration', async () => {
      mockRegister.mockResolvedValueOnce({ success: true });
      mockRefreshUser.mockResolvedValueOnce(undefined);
      
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalled();
      });
    });

    it('should close modal after successful registration', async () => {
      mockRegister.mockResolvedValueOnce({ success: true });
      mockRefreshUser.mockResolvedValueOnce(undefined);
      
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it('should show error message when registration fails', async () => {
      mockError = 'Email already exists';
      mockRegister.mockResolvedValueOnce({ success: false, error: 'Email already exists' });
      
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Modal interactions', () => {
    it('should close modal when clicking on overlay', () => {
      renderModal(true);
      const overlay = screen.getByText('Join FoodieSnap! 🍳').closest('.auth-modal');
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

    it('should clear form fields when closing modal', () => {
      renderModal(true);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = getPasswordInput();
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const closeButton = screen.getByRole('button', { name: '×' });
      fireEvent.click(closeButton);
      
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('Switch to login', () => {
    it('should call onSwitchToLogin when clicking login link', () => {
      renderModal(true);
      const loginButton = screen.getByRole('button', { name: /login here/i });
      fireEvent.click(loginButton);
      expect(onSwitchToLoginMock).toHaveBeenCalled();
    });
  });
});