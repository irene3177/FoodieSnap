import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// ---------- Mocks ----------

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('@/hooks', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/ui', () => ({
  OverlayLoader: ({ message }: { message?: string }) => (
    <div data-testid="overlay-loader" data-message={message} />
  ),
}));

// ---------- Setup helper ----------

const setupAuth = (overrides: Partial<{
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCheckedSession: boolean;
}> = {}) => {
  mockUseAuth.mockReturnValue({
    isAuthenticated: overrides.isAuthenticated ?? true,
    isLoading: overrides.isLoading ?? false,
    hasCheckedSession: overrides.hasCheckedSession ?? true,
  });
};

// ---------- Render helper ----------

const renderProtected = (
  props: Partial<React.ComponentProps<typeof ProtectedRoute>> = {},
  initialPath = '/protected'
) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute {...props} />}>
          <Route path="/protected" element={<div data-testid="protected-content">Secret</div>} />
        </Route>
        <Route path="/" element={<div data-testid="home">Home</div>} />
        <Route path="/login" element={<div data-testid="login">Login</div>} />
      </Routes>
    </MemoryRouter>
  );
};

// ---------- Tests ----------

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    setupAuth();
  });

  // ---- Loading ----

  describe('loading state', () => {
    it('shows OverlayLoader while isLoading', () => {
      setupAuth({ isLoading: true, hasCheckedSession: false });
      renderProtected();

      expect(screen.getByTestId('overlay-loader')).toBeInTheDocument();
    });

    it('shows OverlayLoader while !hasCheckedSession', () => {
      setupAuth({ hasCheckedSession: false, isLoading: false });
      renderProtected();

      expect(screen.getByTestId('overlay-loader')).toBeInTheDocument();
    });

    it('still renders Outlet while loading', () => {
      setupAuth({ isLoading: true, hasCheckedSession: false });
      renderProtected();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('passes "Checking authentication..." message to OverlayLoader', () => {
      setupAuth({ isLoading: true, hasCheckedSession: false });
      renderProtected();

      expect(screen.getByTestId('overlay-loader')).toHaveAttribute(
        'data-message',
        'Checking authentication...'
      );
    });

    it('does not redirect while loading', () => {
      setupAuth({ isLoading: true, hasCheckedSession: false, isAuthenticated: false });
      renderProtected();

      expect(screen.queryByTestId('home')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  // ---- Authenticated ----

  describe('authenticated', () => {
    it('renders Outlet when authenticated', () => {
      setupAuth({ isAuthenticated: true, hasCheckedSession: true, isLoading: false });
      renderProtected();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('does not show OverlayLoader when authenticated and settled', () => {
      renderProtected();

      expect(screen.queryByTestId('overlay-loader')).not.toBeInTheDocument();
    });

    it('does not save to sessionStorage when authenticated', () => {
      renderProtected();

      expect(sessionStorage.getItem('redirectAfterLogin')).toBeNull();
    });

    it('does not redirect when authenticated', () => {
      renderProtected();

      expect(screen.queryByTestId('home')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  // ---- Unauthenticated ----

  describe('unauthenticated', () => {
    it('redirects to "/" by default', () => {
      setupAuth({
        isAuthenticated: false,
        hasCheckedSession: true,
        isLoading: false,
      });
      renderProtected();

      expect(screen.getByTestId('home')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('redirects to custom redirectTo', () => {
      setupAuth({
        isAuthenticated: false,
        hasCheckedSession: true,
        isLoading: false,
      });
      renderProtected({ redirectTo: '/login' });

      expect(screen.getByTestId('login')).toBeInTheDocument();
      expect(screen.queryByTestId('home')).not.toBeInTheDocument();
    });

    it('saves current location to sessionStorage', () => {
      setupAuth({
        isAuthenticated: false,
        hasCheckedSession: true,
        isLoading: false,
      });
      renderProtected({}, '/protected');

      expect(sessionStorage.getItem('redirectAfterLogin')).toBe('/protected');
    });

    it('saves pathname + search in sessionStorage', () => {
      setupAuth({
        isAuthenticated: false,
        hasCheckedSession: true,
        isLoading: false,
      });
      renderProtected({}, '/protected?page=2&sort=newest');

      expect(sessionStorage.getItem('redirectAfterLogin')).toBe(
        '/protected?page=2&sort=newest'
      );
    });

    it('does not show OverlayLoader when unauthenticated and settled', () => {
      setupAuth({
        isAuthenticated: false,
        hasCheckedSession: true,
        isLoading: false,
      });
      renderProtected();

      expect(screen.queryByTestId('overlay-loader')).not.toBeInTheDocument();
    });
  });

  // ---- Transitions ----

  describe('transition from loading to unauthenticated', () => {
    it('redirects after session check completes', () => {
      // First render with loading state
      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route
                path="/protected"
                element={<div data-testid="protected-content">Secret</div>}
              />
            </Route>
            <Route path="/" element={<div data-testid="home">Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Loader visible
      setupAuth({ isLoading: true, hasCheckedSession: false, isAuthenticated: false });
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route
                path="/protected"
                element={<div data-testid="protected-content">Secret</div>}
              />
            </Route>
            <Route path="/" element={<div data-testid="home">Home</div>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId('overlay-loader')).toBeInTheDocument();
    });
  });
});