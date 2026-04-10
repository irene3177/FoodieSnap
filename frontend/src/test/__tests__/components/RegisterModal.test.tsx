import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterModal from '../../../components/Auth/RegisterModal';
import { useAuth } from '../../../hooks/useAuth';
import { ReactNode } from 'react';

// Mock useAuth
vi.mock('../../../hooks/useAuth');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) => (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('RegisterModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSwitchToLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockRefreshUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      refreshUser: mockRefreshUser,
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
    });

    mockRegister.mockResolvedValue({ success: true });
    mockRefreshUser.mockResolvedValue(undefined);
  });

  const renderComponent = (isOpen = true) => {
    return render(
      <RegisterModal
        isOpen={isOpen}
        onClose={mockOnClose}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );
  };

  it('should not render when isOpen is false', () => {
    renderComponent(false);
    
    expect(screen.queryByText('Join FoodieSnap! 🍳')).toBeNull();
  });

  it('should render when isOpen is true', () => {
    renderComponent();
    
    expect(screen.getByText('Join FoodieSnap! 🍳')).toBeDefined();
    expect(screen.getByLabelText('Username')).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
    expect(screen.getByLabelText('Bio (optional)')).toBeDefined();
    expect(screen.getByText('Sign up')).toBeDefined();
    expect(screen.getByText('Already have an account?')).toBeDefined();
    expect(screen.getByText('Login here')).toBeDefined();
  });

  it('should close when clicking on overlay', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const overlay = document.querySelector('.auth-modal');
    if (overlay) {
      await user.click(overlay);
    }
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close when clicking on modal content', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const modalContent = document.querySelector('.auth-modal__content');
    if (modalContent) {
      await user.click(modalContent);
    }
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should close when clicking close button', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const closeButton = screen.getByText('×');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle username input change', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const usernameInput = screen.getByLabelText('Username');
    await user.type(usernameInput, 'testuser');
    
    expect(usernameInput).toHaveValue('testuser');
  });

  it('should handle email input change', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test@example.com');
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should handle password input change', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const passwordInput = screen.getByPlaceholderText('••••••••');
    await user.type(passwordInput, 'password123');
    
    expect(passwordInput).toHaveValue('password123');
  });

  it('should handle bio input change', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const bioInput = screen.getByLabelText('Bio (optional)');
    await user.type(bioInput, 'This is my bio');
    
    expect(bioInput).toHaveValue('This is my bio');
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const toggleButton = screen.getByRole('button', { name: /👁️/ });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Sign up');
    
    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    expect(screen.getByText('Password must be at least 6 characters long')).toBeDefined();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should validate username length', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Sign up');
    
    await user.type(usernameInput, 'ab');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(screen.getByText('Username must be at least 3 characters long')).toBeDefined();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Sign up');
    
    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(mockRegister).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      bio: undefined,
    });
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should submit form with bio', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const bioInput = screen.getByLabelText('Bio (optional)');
    const submitButton = screen.getByText('Sign up');
    
    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(bioInput, 'My awesome bio');
    await user.click(submitButton);
    
    expect(mockRegister).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      bio: 'My awesome bio',
    });
  });

  it('should show error message on failed registration', async () => {
    const user = userEvent.setup();
    
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'Email already exists',
      refreshUser: mockRefreshUser,
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
    });
    
    renderComponent();
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Sign up');
    
    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeDefined();
    });
  });

  it('should show loading state on submit button', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
      refreshUser: mockRefreshUser,
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
    });

    renderComponent();
    
    const submitButton = screen.getByText('Creating account...');
    expect(submitButton).toBeDisabled();
  });

  it('should switch to login modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const switchButton = screen.getByText('Login here');
    await user.click(switchButton);
    
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('should disable inputs during loading', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
      refreshUser: mockRefreshUser,
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
    });

    renderComponent();
    
    expect(screen.getByLabelText('Username')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByPlaceholderText('••••••••')).toBeDisabled();
    expect(screen.getByLabelText('Bio (optional)')).toBeDisabled();
    expect(screen.getByText('Creating account...')).toBeDisabled();
  });
});