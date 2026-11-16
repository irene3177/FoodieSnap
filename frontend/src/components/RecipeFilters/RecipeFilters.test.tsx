import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeFilters } from './RecipeFilters';

// ---------- Mocks ----------

vi.mock('@/hooks', () => ({
  useScrollLock: vi.fn(),
}));

vi.mock('@/constants', () => ({
  DIFFICULTY_OPTIONS: [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ],
}));

// ---------- Render helper ----------

const renderFilters = (
  props: Partial<React.ComponentProps<typeof RecipeFilters>> = {}
) => {
  const defaults = {
    onFilterChange: vi.fn(),
    isLoading: false,
    isOpen: true,
    onClose: vi.fn(),
    categories: ['Italian', 'Mexican'],
    tags: ['vegan', 'quick'],
    areas: ['Italy', 'Mexico'],
    filtersLoading: false,
  };
  const merged = { ...defaults, ...props };

  const utils = render(<RecipeFilters {...merged} />);
  return { ...utils, ...merged };
};

const openDetailsBySummaryText = (text: string): HTMLElement => {
  const details = Array.from(document.querySelectorAll('details'));
  const target = details.find((d) => {
    const summary = d.querySelector('summary');
    return summary?.textContent?.trim().startsWith(text);
  });
  if (!target) throw new Error(`<details> "${text}" not found`);
  fireEvent.click(target.querySelector('summary')!);
  return target as HTMLElement;
};

// ---------- Tests ----------

describe('RecipeFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Overlay / close ----

  describe('overlay and close', () => {
    it('calls onClose on overlay click', () => {
      const onClose = vi.fn();
      const { container } = renderFilters({ onClose });

      const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on X click', async () => {
      const onClose = vi.fn();
      renderFilters({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /close menu/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Sort ----

  describe('sort', () => {
    it('changes sort value', async () => {
      renderFilters();

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await userEvent.selectOptions(select, 'popular');

      expect(select.value).toBe('popular');
    });
  });

  // ---- Difficulty ----

  describe('difficulty', () => {
    it('selects difficulty on click', async () => {
      renderFilters();

      const easyButton = screen.getByRole('button', { name: /^easy$/i });
      await userEvent.click(easyButton);

      expect(easyButton.className).toContain('bg-accent-secondary-bg');
    });

    it('deselects on second click', async () => {
      renderFilters();

      const easyButton = screen.getByRole('button', { name: /^easy$/i });
      await userEvent.click(easyButton);
      await userEvent.click(easyButton);

      expect(easyButton.className).not.toContain('bg-accent-secondary-bg');
    });
  });

  // ---- Rating ----

  describe('rating', () => {
    it('shows "N+" indicator when rating selected', async () => {
      renderFilters();

      const allButtons = screen.getAllByRole('button');
      const ratingButtons = allButtons.filter((b) => b.className.includes('p-1'));

      expect(ratingButtons.length).toBe(5);

      await userEvent.click(ratingButtons[2]);

      expect(screen.getByText('3+')).toBeInTheDocument();
    });

    it('removes rating on second click of same star', async () => {
      renderFilters();

      const allButtons = screen.getAllByRole('button');
      const ratingButtons = allButtons.filter((b) => b.className.includes('p-1'));

      await userEvent.click(ratingButtons[2]);
      expect(screen.getByText('3+')).toBeInTheDocument();

      await userEvent.click(ratingButtons[2]);
      expect(screen.queryByText('3+')).not.toBeInTheDocument();
    });
  });

  // ---- Cooking time ----

  describe('cooking time', () => {
    it('shows formatted time when slider is moved', () => {
      renderFilters();

      const slider = screen.getByRole('slider') as HTMLInputElement;
      fireEvent.change(slider, { target: { value: '90' } });

      expect(screen.getByText(/Up to 1h 30m/)).toBeInTheDocument();
    });

    it('shows "0m" when slider is 0', () => {
      renderFilters();

      const slider = screen.getByRole('slider') as HTMLInputElement;
      fireEvent.change(slider, { target: { value: '0' } });

      expect(screen.getByText(/Up to 0m/)).toBeInTheDocument();
    });
  });

  // ---- Media ----

  describe('media', () => {
    it('toggles Video checkbox', async () => {
      renderFilters();

      const videoCheckbox = screen.getByRole('checkbox', {
        name: /video/i,
      }) as HTMLInputElement;
      expect(videoCheckbox.checked).toBe(false);

      await userEvent.click(videoCheckbox);

      expect(videoCheckbox.checked).toBe(true);
    });

    it('toggles Image checkbox', async () => {
      renderFilters();

      const imageCheckbox = screen.getByRole('checkbox', {
        name: /^image$/i,
      }) as HTMLInputElement;
      await userEvent.click(imageCheckbox);

      expect(imageCheckbox.checked).toBe(true);
    });
  });

  // ---- Categories ----

  describe('categories', () => {
    it('renders categories when section is open', () => {
      renderFilters();
      openDetailsBySummaryText('Categories');

      expect(
        screen.getByRole('checkbox', { name: /italian/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /mexican/i })
      ).toBeInTheDocument();
    });

    it('shows counter when categories selected', async () => {
      renderFilters();
      const details = openDetailsBySummaryText('Categories');

      await userEvent.click(screen.getByRole('checkbox', { name: /italian/i }));
      await userEvent.click(screen.getByRole('checkbox', { name: /mexican/i }));

      const summary = details.querySelector('summary') as HTMLElement;
      expect(within(summary).getByText('2')).toBeInTheDocument();
    });

    it('shows "Loading categories..." when filtersLoading', () => {
      renderFilters({ filtersLoading: true, categories: [] });
      openDetailsBySummaryText('Categories');

      expect(screen.getByText(/loading categories/i)).toBeInTheDocument();
    });

    it('shows "No categories available" for empty list', () => {
      renderFilters({ categories: [] });
      openDetailsBySummaryText('Categories');

      expect(screen.getByText(/no categories available/i)).toBeInTheDocument();
    });
  });

  // ---- Tags ----

  describe('tags', () => {
    it('renders tags when section is open', () => {
      renderFilters();
      openDetailsBySummaryText('Tags');

      expect(
        screen.getByRole('checkbox', { name: /vegan/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /quick/i })
      ).toBeInTheDocument();
    });

    it('shows counter when tags selected', async () => {
      renderFilters();
      const details = openDetailsBySummaryText('Tags');

      await userEvent.click(screen.getByRole('checkbox', { name: /vegan/i }));

      const summary = details.querySelector('summary') as HTMLElement;
      expect(within(summary).getByText('1')).toBeInTheDocument();
    });
  });

  // ---- Cuisines ----

  describe('cuisines', () => {
    it('renders areas when section is open', () => {
      renderFilters();
      openDetailsBySummaryText('Cuisines');

      expect(screen.getByRole('radio', { name: /italy/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /mexico/i })).toBeInTheDocument();
    });

    it('selects a cuisine via radio', async () => {
      renderFilters();
      openDetailsBySummaryText('Cuisines');

      const italyRadio = screen.getByRole('radio', {
        name: /italy/i,
      }) as HTMLInputElement;
      await userEvent.click(italyRadio);

      expect(italyRadio.checked).toBe(true);
    });

    it('"All Cuisines" resets selection', async () => {
      renderFilters();
      openDetailsBySummaryText('Cuisines');

      await userEvent.click(screen.getByRole('radio', { name: /italy/i }));
      await userEvent.click(
        screen.getByRole('radio', { name: /all cuisines/i })
      );

      const allRadio = screen.getByRole('radio', {
        name: /all cuisines/i,
      }) as HTMLInputElement;
      expect(allRadio.checked).toBe(true);
    });
  });

  // ---- Apply ----

  describe('apply filters', () => {
    it('calls onFilterChange with selected filters', async () => {
      const onFilterChange = vi.fn();
      renderFilters({ onFilterChange });

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await userEvent.selectOptions(select, 'popular');

      await userEvent.click(screen.getByRole('button', { name: /^easy$/i }));
      await userEvent.click(screen.getByRole('checkbox', { name: /video/i }));

      await userEvent.click(
        screen.getByRole('button', { name: /apply filters/i })
      );

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'popular',
          difficulty: 'easy',
          hasVideo: true,
        })
      );
    });

    it('always includes sort (default is "newest")', async () => {
      const onFilterChange = vi.fn();
      renderFilters({ onFilterChange });

      await userEvent.click(
        screen.getByRole('button', { name: /apply filters/i })
      );

      const filters = onFilterChange.mock.calls[0][0];
      expect(filters.sort).toBe('newest');
    });

    it('does not include optional fields when unset', async () => {
      const onFilterChange = vi.fn();
      renderFilters({ onFilterChange });

      await userEvent.click(
        screen.getByRole('button', { name: /apply filters/i })
      );

      const filters = onFilterChange.mock.calls[0][0];
      expect(filters).not.toHaveProperty('difficulty');
      expect(filters).not.toHaveProperty('maxCookingTime');
      expect(filters).not.toHaveProperty('minRating');
      expect(filters).not.toHaveProperty('area');
      expect(filters).not.toHaveProperty('hasVideo');
      expect(filters).not.toHaveProperty('hasImage');
    });
  });

  // ---- Reset ----

  describe('reset', () => {
    it('resets all state and calls onFilterChange({})', async () => {
      const onFilterChange = vi.fn();
      renderFilters({ onFilterChange });

      const easyButton = screen.getByRole('button', { name: /^easy$/i });
      const videoCheckbox = screen.getByRole('checkbox', {
        name: /video/i,
      }) as HTMLInputElement;

      await userEvent.click(easyButton);
      await userEvent.click(videoCheckbox);

      expect(easyButton.className).toContain('bg-accent-secondary-bg');
      expect(videoCheckbox.checked).toBe(true);

      await userEvent.click(screen.getByRole('button', { name: /reset all/i }));

      expect(onFilterChange).toHaveBeenCalledWith({});
      expect(easyButton.className).not.toContain('bg-accent-secondary-bg');
      expect(videoCheckbox.checked).toBe(false);
    });
  });

  // ---- Loading ----

  describe('loading', () => {
    it('disables controls when isLoading', () => {
      renderFilters({ isLoading: true });

      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByRole('slider')).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /apply filters/i })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /reset all/i })
      ).toBeDisabled();
    });
  });
});