import { MdSchedule } from 'react-icons/md';
import clsx from 'clsx';

export type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

interface PreparationSectionProps {
  cookingTime: number;
  difficulty: Difficulty;
  onCookingTimeChange: (value: number) => void;
  onDifficultyChange: (value: Difficulty) => void;
}

export function PreparationSection({
  cookingTime,
  difficulty,
  onCookingTimeChange,
  onDifficultyChange,
}: PreparationSectionProps) {
  return (
    <section className="p-6 border rounded-xl space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <MdSchedule className="text-accent text-xl" />
        <h2 className="text-2xl text-secondary cursor-default">Preparation</h2>
      </div>
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block mb-2 font-medium text-md text-muted">Cooking Time (minutes)</label>
            <input
              type="number"
              value={cookingTime}
              onChange={(e) => onCookingTimeChange(parseInt(e.target.value) || 0)}
              min={1}
              className="
              max-w-20
                input
                [appearance:textfield]
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none
              "
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="block mb-2 font-medium text-md text-muted">Difficulty Level</label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(item => {
              const isActive = difficulty === item.value;
              return (
              <button
                className={clsx(
                  "flex-1 py-2 px-3 rounded-lg border border-outline/20 text-secondary",
                  "hover:border-accent transition-all duration-1000 italic",
                  {"border-accent bg-accent-bg": isActive}
                )}
                key={item.value}
                type="button"
                onClick={() => onDifficultyChange(item.value)}
              >{item.label}</button>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}