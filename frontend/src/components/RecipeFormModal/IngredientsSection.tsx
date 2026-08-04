import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef } from 'react';
import { MdClose, MdListAlt } from 'react-icons/md';

interface IngredientsSectionProps {
  ingredients: string[];
  ingredientInput: string;
  onIngredientInputChange: (value: string) => void;
  onAddIngredient: (value: string) => void;
  onRemoveIngredient: (index: number) => void;
  onIngredientKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const IngredientsSection = forwardRef<HTMLInputElement, IngredientsSectionProps>(
  function IngredientsSection({
  ingredients,
  ingredientInput,
  onIngredientInputChange,
  onRemoveIngredient,
  onIngredientKeyDown,
},
ref
) {
  return (
    <section className="p-6 border rounded-xl space-y-4 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <MdListAlt className="text-accent text-xl" />
        <h2 className="text-secondary cursor-default text-2xl">Ingredients</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-4">
          {/* Hint */}
          <p className="text-xs text-muted cursor-default">
            <span>
              Type an ingredient and press{' '}
              <kbd className="rounded border px-1 py-0.5 text-[10px] font-medium text-text-muted">Enter</kbd>{' '}
              or{' '}
              <kbd className="rounded border px-1 py-0.5 text-[10px] font-medium text-text-muted">,</kbd>{' '}
              to add. Click <MdClose className="inline text-accent" /> to remove.
            </span>
            <br />
            <span>
              Examples: <span className="text-accent">3 Medium Potatoes</span>,{' '}
              <span className="text-accent">1 tbsp Olive Oil</span>,{' '}
              <span className="text-accent">2 strips Bacon</span>,{' '}
              <span className="text-accent">Pinch Pepper</span>
            </span>
          </p>
          <input
            ref={ref}
            type="text"
            value={ingredientInput}
            onChange={(e) => onIngredientInputChange(e.target.value)}
            onKeyDown={onIngredientKeyDown}
            placeholder="e.g., 3 Medium Potatoes, 1 tbsp Olive Oil..."
            className="input"
          />
          

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg px-2">
            <AnimatePresence mode="popLayout">
              {ingredients.map((ingredient, index) => (
                <motion.span
                  key={ingredient}
                  layout
                  className="
                    inline-flex items-center gap-1
                    border rounded-xl
                    bg-accent-tertiary-bg border-tertiary-container
                    ps-2 pe-0.5 py-2
                    text-sm font-medium text-tertiary-container
                    cursor-default
                  "
                >
                  {ingredient}
                  <button
                    type="button"
                    onClick={() => onRemoveIngredient(index)}
                    className="
                      inline-flex items-center justify-center rounded-lg
                      text-tertiary hover:bg-accent-tertiary-container p-0.5
                      transition-all duration-700
                    "
                    aria-label={`Remove ${ingredient}`}
                  >
                    <MdClose />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
});