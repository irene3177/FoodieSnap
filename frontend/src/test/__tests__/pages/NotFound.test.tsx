import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../../../pages/NotFound/NotFound';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
  };

  it('should render 404 page', () => {
    renderComponent();
    
    expect(screen.getByText('404')).toBeDefined();
    expect(screen.getByText('Page Not Found')).toBeDefined();
    expect(screen.getByText(/Oops! The page you're looking for doesn't exist or has been moved/)).toBeDefined();
  });

  it('should render Go Back button', () => {
    renderComponent();
    
    const goBackButton = screen.getByText('← Go Back');
    expect(goBackButton).toBeDefined();
  });

  it('should render Go Home link', () => {
    renderComponent();
    
    const goHomeLink = screen.getByText('Go Home');
    expect(goHomeLink).toBeDefined();
    expect(goHomeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('should navigate back when Go Back button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const goBackButton = screen.getByText('← Go Back');
    await user.click(goBackButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should have correct button classes', () => {
    renderComponent();
    
    const goBackButton = screen.getByText('← Go Back');
    const goHomeLink = screen.getByText('Go Home');
    
    expect(goBackButton.className).toContain('not-found__button--secondary');
    expect(goHomeLink.className).toContain('not-found__button--primary');
  });
});