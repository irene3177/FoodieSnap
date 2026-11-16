import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeActions from './RecipeActions';
import { recipesApi } from '@/services/recipesApi';
import type { Recipe } from '@/types';

// ---------- Hoisted mocks ----------

const { mockDispatch, mockShowToast } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockShowToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
}));

vi.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  showToast: mockShowToast,
}));

vi.mock('@/services/recipesApi');

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      button: React.forwardRef((props: any, ref: any) => {
        const { ...rest } = props;
        return <button ref={ref} {...rest} />;
      }),
      div: React.forwardRef((props: any, ref: any) => {
        const { ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
  };
});

// ---------- Test data ----------

const makeRecipe = (): Recipe => ({
  _id: 'r1',
  title: 'Pasta Carbonara',
  description: '',
  ingredients: [],
  instructions: [],
  imageUrl: '',
  difficulty: 'easy',
  rating: 0,
  ratingCount: 0,
  source: 'user',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

// ---------- Render helper ----------

const renderActions = (
  props: Partial<React.ComponentProps<typeof RecipeActions>> = {}
) => {
  const defaults = {
    recipe: makeRecipe(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isOwner: true,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<RecipeActions {...merged} />);
  return { ...utils, ...merged };
};

// ---------- Tests ----------

describe('RecipeActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (recipesApi.deleteRecipe as any).mockResolvedValue({ success: true });
  });

  // ---- Owner visibility ----

  describe('visibility', () => {
    it('renders nothing when isOwner=false', () => {
      const { container } = renderActions({ isOwner: false });

      expect(container.firstChild).toBeNull();
    });

    it('renders Edit and Delete buttons when isOwner=true', () => {
      renderActions({ isOwner: true });

      expect(screen.getByRole('button', { name: /edit recipe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete recipe/i })).toBeInTheDocument();
    });
  });

  // ---- Edit ----

  describe('edit', () => {
    it('calls onEdit with recipe on click', async () => {
      const onEdit = vi.fn();
      const recipe = makeRecipe();
      renderActions({ recipe, onEdit });

      await userEvent.click(screen.getByRole('button', { name: /edit recipe/i }));

      expect(onEdit).toHaveBeenCalledWith(recipe);
    });

    it('stops propagation to parent onClick', async () => {
      const parentClick = vi.fn();
      render(
        <div onClick={parentClick}>
          <RecipeActions recipe={makeRecipe()} onEdit={vi.fn()} isOwner />
        </div>
      );

      await userEvent.click(screen.getByRole('button', { name: /edit recipe/i }));

      expect(parentClick).not.toHaveBeenCalled();
    });

    it('does not throw when onEdit is undefined', async () => {
      renderActions({ onEdit: undefined });

      await userEvent.click(screen.getByRole('button', { name: /edit recipe/i }));
      // Nothing to assert, just shouldn't crash
    });
  });

  // ---- Delete ----

  describe('delete flow', () => {
    it('opens confirm modal on delete click', async () => {
      renderActions();

      expect(screen.queryByText(/delete recipe\?/i)).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));

      expect(screen.getByText(/delete recipe\?/i)).toBeInTheDocument();
    });

    it('confirm modal shows recipe title', async () => {
      renderActions();

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));

      expect(screen.getByText('"Pasta Carbonara"')).toBeInTheDocument();
    });

    it('renders confirm modal in document.body (portal)', async () => {
      const { baseElement } = renderActions();

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));

      const modal = screen.getByText(/delete recipe\?/i);
      expect(baseElement.contains(modal)).toBe(true);
    });

    it('stops propagation on delete click', async () => {
      const parentClick = vi.fn();
      render(
        <div onClick={parentClick}>
          <RecipeActions recipe={makeRecipe()} onDelete={vi.fn()} isOwner />
        </div>
      );

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));

      expect(parentClick).not.toHaveBeenCalled();
    });

    it('Cancel closes modal without API call', async () => {
      renderActions();

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText(/delete recipe\?/i)).not.toBeInTheDocument();
      });
      expect(recipesApi.deleteRecipe).not.toHaveBeenCalled();
    });

    it('closes modal on overlay click', async () => {
      renderActions();

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));

      // The overlay is the outermost div with bg-black/60
      const overlay = document.querySelector('.fixed.inset-0') as HTMLElement;
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay);

      await waitFor(() => {
        expect(screen.queryByText(/delete recipe\?/i)).not.toBeInTheDocument();
      });
    });

    it('does not close modal when clicking inside', async () => {
      renderActions();

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));
      await userEvent.click(screen.getByText(/delete recipe\?/i));

      expect(screen.getByText(/delete recipe\?/i)).toBeInTheDocument();
    });
  });

  // ---- Confirm delete ----

  describe('confirm delete', () => {
    it('calls recipesApi.deleteRecipe with recipe id', async () => {
      const recipe = makeRecipe();
      renderActions({ recipe });

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));
      await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

      await waitFor(() => {
        expect(recipesApi.deleteRecipe).toHaveBeenCalledWith('r1');
      });
    });

    it('shows success toast and calls onDelete on success', async () => {
      const onDelete = vi.fn();
      renderActions({ onDelete });

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));
      await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Recipe deleted successfully',
          type: 'success',
        });
      });
      expect(onDelete).toHaveBeenCalledWith('r1');
    });

    it('closes modal after successful delete', async () => {
      renderActions();

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));
      await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

      await waitFor(() => {
        expect(screen.queryByText(/delete recipe\?/i)).not.toBeInTheDocument();
      });
    });

    it('shows error toast when API fails', async () => {
      (recipesApi.deleteRecipe as any).mockResolvedValue({ success: false });
      const onDelete = vi.fn();
      renderActions({ onDelete });

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));
      await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Failed to delete recipe',
          type: 'error',
        });
      });
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('shows loading state during delete', async () => {
      // Never resolves
      (recipesApi.deleteRecipe as any).mockImplementation(() => new Promise(() => {}));

      renderActions();

      await userEvent.click(screen.getByRole('button', { name: /delete recipe/i }));
      await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });
    });
  });
});