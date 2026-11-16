import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeFormModal from './RecipeFormModal';
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

vi.mock('@/hooks', () => ({
  useScrollLock: vi.fn(),
}));

vi.mock('@/services/recipesApi');

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: React.forwardRef((props: any, ref: any) => {
        const { ...rest } = props;
        return <div ref={ref} {...rest} />;
      }),
    },
  };
});

vi.mock('react-textarea-autosize', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, ref: any) => {
      const { ...rest } = props;
      return <textarea ref={ref} {...rest} />;
    }),
  };
});

vi.mock('./BasicInfoSection', () => ({
  BasicInfoSection: ({ title, description, onTitleChange, onDescriptionChange }: any) => (
    <div data-testid="basic-info">
      <input
        aria-label="recipe title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <textarea
        aria-label="recipe description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('./MediaSection', () => ({
  MediaSection: ({ imageUrl, onImageUrlChange }: any) => (
    <div data-testid="media">
      <input
        aria-label="image url"
        value={imageUrl}
        onChange={(e) => onImageUrlChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('./PreparationSection', () => ({
  PreparationSection: ({ cookingTime, difficulty, onCookingTimeChange, onDifficultyChange }: any) => (
    <div data-testid="preparation">
      <input
        aria-label="cooking time"
        value={cookingTime}
        onChange={(e) => onCookingTimeChange(Number(e.target.value))}
      />
      <button
        type="button"
        aria-label="set difficulty hard"
        onClick={() => onDifficultyChange('hard')}
      >
        {difficulty}
      </button>
    </div>
  ),
}));

vi.mock('./IngredientsSection', async () => {
  const React = await import('react');
  return {
    IngredientsSection: React.forwardRef((props: any, ref: any) => {
      const {
        ingredients,
        ingredientInput,
        onIngredientInputChange,
        onIngredientKeyDown,
        onRemoveIngredient,
      } = props;
      return (
        <div data-testid="ingredients">
          <input
            ref={ref}
            aria-label="ingredient input"
            value={ingredientInput}
            onChange={(e) => onIngredientInputChange(e.target.value)}
            onKeyDown={onIngredientKeyDown}
          />
          <ul>
            {ingredients.map((ing: string, i: number) => (
              <li key={i}>
                <span>{ing}</span>
                <button
                  type="button"
                  aria-label={`remove ingredient ${i}`}
                  onClick={() => onRemoveIngredient(i)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }),
  };
});

vi.mock('./InstructionsSection', () => ({
  InstructionsSection: ({ instructions, onAddInstruction, onRemoveInstruction, onUpdateInstruction }: any) => (
    <div data-testid="instructions">
      <button type="button" onClick={onAddInstruction} aria-label="add instruction">
        Add
      </button>
      {instructions.map((instr: string, i: number) => (
        <div key={i}>
          <textarea
            aria-label={`instruction ${i}`}
            value={instr}
            onChange={(e) => onUpdateInstruction(i, e.target.value)}
          />
          <button
            type="button"
            aria-label={`remove instruction ${i}`}
            onClick={() => onRemoveInstruction(i)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  ),
}));

// ---------- Test data ----------

const makeRecipe = (): Recipe => ({
  _id: 'r1',
  title: 'Pasta Carbonara',
  description: 'Classic Italian',
  ingredients: ['pasta', 'eggs'],
  instructions: ['Boil pasta', 'Mix'],
  imageUrl: 'https://example.com/pasta.jpg',
  cookingTime: 25,
  difficulty: 'medium',
  rating: 0,
  ratingCount: 0,
  source: 'user',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

// ---------- Render helper ----------

const renderModal = (
  props: Partial<React.ComponentProps<typeof RecipeFormModal>> = {}
) => {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    recipe: null as Recipe | null,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<RecipeFormModal {...merged} />);
  return { ...utils, ...merged };
};

const getTitleInput = () =>
  screen.getByLabelText('recipe title') as HTMLInputElement;

const getIngredientInput = () =>
  screen.getByLabelText('ingredient input') as HTMLInputElement;

// ---------- Tests ----------

describe('RecipeFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (recipesApi.createRecipe as any).mockResolvedValue({ success: true });
    (recipesApi.updateRecipe as any).mockResolvedValue({ success: true });
  });

  // ---- Visibility ----

  describe('visibility', () => {
    it('renders nothing when isOpen=false', () => {
      renderModal({ isOpen: false });

      expect(screen.queryByTestId('basic-info')).not.toBeInTheDocument();
    });

    it('renders when isOpen=true', () => {
      renderModal();

      expect(screen.getByTestId('basic-info')).toBeInTheDocument();
    });
  });

  // ---- Titles ----

  describe('titles', () => {
    it('shows "Create New Recipe" in create mode', () => {
      renderModal();

      expect(
        screen.getByRole('heading', { name: /create new recipe/i })
      ).toBeInTheDocument();
    });

    it('shows "Edit Recipe" in edit mode', () => {
      renderModal({ recipe: makeRecipe() });

      expect(
        screen.getByRole('heading', { name: /edit recipe/i })
      ).toBeInTheDocument();
    });

    it('shows "Create Recipe" submit text in create mode', () => {
      renderModal();

      expect(
        screen.getByRole('button', { name: /create recipe/i })
      ).toBeInTheDocument();
    });

    it('shows "Save Changes" submit text in edit mode', () => {
      renderModal({ recipe: makeRecipe() });

      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument();
    });
  });

  // ---- Edit mode fill ----

  describe('edit mode', () => {
    it('fills form with recipe data when open', () => {
      renderModal({ recipe: makeRecipe() });

      expect(getTitleInput().value).toBe('Pasta Carbonara');
      expect(
        (screen.getByLabelText('recipe description') as HTMLTextAreaElement).value
      ).toBe('Classic Italian');
      expect(
        (screen.getByLabelText('image url') as HTMLInputElement).value
      ).toBe('https://example.com/pasta.jpg');
      expect(
        (screen.getByLabelText('cooking time') as HTMLInputElement).value
      ).toBe('25');
    });

    it('does not fill form when recipe is null', () => {
      renderModal({ recipe: null });

      expect(getTitleInput().value).toBe('');
    });

    it('shows existing ingredients and instructions', () => {
      renderModal({ recipe: makeRecipe() });

      expect(screen.getByText('pasta')).toBeInTheDocument();
      expect(screen.getByText('eggs')).toBeInTheDocument();
      expect(
        (screen.getByLabelText('instruction 0') as HTMLTextAreaElement).value
      ).toBe('Boil pasta');
    });
  });

  // ---- Ingredients ----

  describe('ingredients', () => {
    it('adds ingredient on Enter', async () => {
      renderModal();

      await userEvent.type(getIngredientInput(), 'flour{Enter}');

      expect(screen.getByText('flour')).toBeInTheDocument();
    });

    it('adds ingredient on comma', async () => {
      renderModal();

      await userEvent.type(getIngredientInput(), 'sugar,');

      expect(screen.getByText('sugar')).toBeInTheDocument();
    });

    it('trims and dedupes ingredients', async () => {
      renderModal();

      await userEvent.type(getIngredientInput(), '  flour  {Enter}');
      await userEvent.type(getIngredientInput(), 'flour{Enter}');

      const items = screen.getAllByText('flour');
      expect(items).toHaveLength(1);
    });

    it('does not add empty ingredient', async () => {
      renderModal();

      await userEvent.type(getIngredientInput(), '   {Enter}');

      expect(
        screen.queryByRole('button', { name: /remove ingredient 0/i })
      ).not.toBeInTheDocument();
    });

    it('removes ingredient by index', async () => {
      renderModal();

      await userEvent.type(getIngredientInput(), 'a{Enter}');
      await userEvent.type(getIngredientInput(), 'b{Enter}');

      await userEvent.click(
        screen.getByRole('button', { name: /remove ingredient 0/i })
      );

      expect(screen.queryByText('a')).not.toBeInTheDocument();
      expect(screen.getByText('b')).toBeInTheDocument();
    });
  });

  // ---- Instructions ----

  describe('instructions', () => {
    it('adds new instruction', async () => {
      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /add instruction/i }));

      expect(
        screen.getByLabelText('instruction 1')
      ).toBeInTheDocument();
    });

    it('updates instruction text', async () => {
      renderModal();

      await userEvent.type(
        screen.getByLabelText('instruction 0'),
        'Step one'
      );

      expect(
        (screen.getByLabelText('instruction 0') as HTMLTextAreaElement).value
      ).toBe('Step one');
    });

    it('removes instruction', async () => {
      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /add instruction/i }));

      await userEvent.click(
        screen.getByRole('button', { name: /remove instruction 1/i })
      );

      expect(screen.queryByLabelText('instruction 1')).not.toBeInTheDocument();
    });
  });

  // ---- Validation ----

  describe('validation', () => {
    it('shows toast and does not call API when title is empty', async () => {
      renderModal();

      await userEvent.type(getIngredientInput(), 'flour{Enter}');
      await userEvent.type(screen.getByLabelText('instruction 0'), 'step');

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Title is required',
          type: 'error',
        });
      });
      expect(recipesApi.createRecipe).not.toHaveBeenCalled();
    });

    it('shows toast when no ingredients', async () => {
      renderModal();

      await userEvent.type(getTitleInput(), 'Pizza');
      await userEvent.type(screen.getByLabelText('instruction 0'), 'step');

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'At least one ingredient is required',
          type: 'error',
        });
      });
    });

    it('shows toast when no instructions', async () => {
      renderModal();

      await userEvent.type(getTitleInput(), 'Pizza');
      await userEvent.type(getIngredientInput(), 'flour{Enter}');

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'At least one instruction is required',
          type: 'error',
        });
      });
    });
  });

  // ---- Create submit ----

  describe('create submit', () => {
    const fillValidForm = async () => {
      await userEvent.type(getTitleInput(), 'My Pizza');
      await userEvent.type(screen.getByLabelText('image url'), 'https://x.com/img.jpg');
      await userEvent.type(getIngredientInput(), 'flour{Enter}');
      await userEvent.type(screen.getByLabelText('instruction 0'), 'Knead the dough');
    };

    it('calls recipesApi.createRecipe with form data', async () => {
      renderModal();
      await fillValidForm();

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(recipesApi.createRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'My Pizza',
            imageUrl: 'https://x.com/img.jpg',
            ingredients: ['flour'],
            instructions: ['Knead the dough'],
          })
        );
      });
    });

    it('calls onSuccess and onClose on success', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();
      renderModal({ onSuccess, onClose });
      await fillValidForm();

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('shows success toast', async () => {
      renderModal();
      await fillValidForm();

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Recipe created successfully!',
          type: 'success',
        });
      });
    });
  });

  // ---- Edit submit ----

  describe('edit submit', () => {
    it('calls recipesApi.updateRecipe with id', async () => {
      const recipe = makeRecipe();
      renderModal({ recipe });

      await userEvent.clear(getTitleInput());
      await userEvent.type(getTitleInput(), 'Updated Title');

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(recipesApi.updateRecipe).toHaveBeenCalledWith(
          'r1',
          expect.objectContaining({ title: 'Updated Title' })
        );
      });
    });

    it('shows "Recipe updated successfully!" toast', async () => {
      renderModal({ recipe: makeRecipe() });

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Recipe updated successfully!',
          type: 'success',
        });
      });
    });
  });

  // ---- Errors ----

  describe('errors', () => {
    const fillValidForm = async () => {
      await userEvent.type(getTitleInput(), 'X');
      await userEvent.type(getIngredientInput(), 'flour{Enter}');
      await userEvent.type(screen.getByLabelText('instruction 0'), 'do');
    };

    it('shows error toast when success=false', async () => {
      (recipesApi.createRecipe as any).mockResolvedValue({
        success: false,
        error: 'Server error',
      });

      renderModal();
      await fillValidForm();

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Server error',
          type: 'error',
        });
      });
    });

    it('shows fallback error toast when API throws', async () => {
      (recipesApi.createRecipe as any).mockRejectedValue(new Error('Network'));

      renderModal();
      await fillValidForm();

      fireEvent.submit(getTitleInput().closest('form')!);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          message: 'Failed to create recipe',
          type: 'error',
        });
      });
    });
  });

  // ---- Close ----

  describe('close', () => {
    it('calls onClose on Cancel', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on overlay click', () => {
      const onClose = vi.fn();
      const { container } = renderModal({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});