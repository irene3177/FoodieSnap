import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginModal from '../../../components/Auth/LoginModal';
import { useAuth } from '../../../hooks/useAuth';
import { ReactNode } from 'react';

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock framer-motion with proper types
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, 'data-testid': testId }: { children: ReactNode; onClick?: () => void; className?: string; 'data-testid'?: string }) => (
      <div className={className} onClick={onClick} data-testid={testId}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('LoginModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSwitchToRegister = vi.fn();
  const mockLogin = vi.fn();
  const mockRefreshUser = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      refreshUser: mockRefreshUser,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
    });
  });

  const renderComponent = (isOpen = true) => {
    return render(
      <LoginModal
        isOpen={isOpen}
        onClose={mockOnClose}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );
  };

  it('should not render when isOpen is false', () => {
    renderComponent(false);
    
    expect(screen.queryByText('Welcome Back! 👋')).toBeNull();
  });

  it('should render when isOpen is true', () => {
    renderComponent();
    
    expect(screen.getByText('Welcome Back! 👋')).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByText('Login')).toBeDefined();
    expect(screen.getByText("Don't have an account?")).toBeDefined();
    expect(screen.getByText('Sign up here')).toBeDefined();
  });

  it('should close when clicking on overlay', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Find the overlay by its class name instead of test-id
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
    
    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'password123');
    
    expect(passwordInput).toHaveValue('password123');
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button', { name: /👁️/ });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should submit form with email and password', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    mockRefreshUser.mockResolvedValue(undefined);
    
    renderComponent();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByText('Login');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show loading state on submit button', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      refreshUser: mockRefreshUser,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
    });
    
    renderComponent();
    
    const submitButton = screen.getByText('Logging in...');
    expect(submitButton).toBeDisabled();
  });

  it('should show error message on failed login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: false });
    
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials',
      refreshUser: mockRefreshUser,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
    });
    
    renderComponent();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByText('Login');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined();
    });
  });

  it('should switch to register modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const switchButton = screen.getByText('Sign up here');
    await user.click(switchButton);
    
    expect(mockOnSwitchToRegister).toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable inputs and buttons during loading', () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      refreshUser: mockRefreshUser,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      hasCheckedSession: true,
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
    });
    
    renderComponent();
    
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByText('Logging in...')).toBeDisabled();
    expect(screen.getByText('Sign up here')).toBeDisabled();
  });

  it('should clear form on close', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const closeButton = screen.getByText('×');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockClearError).toHaveBeenCalled();
  });
});