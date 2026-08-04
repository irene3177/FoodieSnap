import { MdFormatListNumbered, MdAddCircleOutline } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import TextareaAutosize from 'react-textarea-autosize';

interface InstructionsSectionProps {
  instructions: string[];
  onAddInstruction: () => void;
  onRemoveInstruction: (index: number) => void;
  onUpdateInstruction: (index: number, value: string) => void;
}

export function InstructionsSection({
  instructions,
  onAddInstruction,
  onRemoveInstruction,
  onUpdateInstruction,
}: InstructionsSectionProps) {
  return (
    <section className="p-6 border rounded-xl space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <MdFormatListNumbered className="text-accent text-xl" />
          <h2 className="text-2xl cursor-default text-secondary">Instructions</h2>
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-xs text-muted">
          Write each step clearly. Press{' '}
          <kbd className="rounded border px-1 py-0.5 text-[10px] font-medium text-muted">+ Add Step</kbd>{' '}
          to add a new step.
        </p>
        <div className="space-y-4">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2 items-start group">
              <div className="
                flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full
                bg-surface-container-high border text-accent font-display-lg text-sm mt-1
                ">
                {index + 1}
              </div>
              <div className="
                flex-1 p-4 rounded-xl border border-l-2 border-l-accent-secondary
                group-hover:bg-white/5 transition-colors duration-700
              ">
                <TextareaAutosize
                  value={instruction}
                  onChange={(e) => onUpdateInstruction(index, e.target.value)}
                  placeholder="Describe this step..."
                  rows={2}
                  className="
                    bg-transparent
                    rounded-none
                    border-none focus:ring-0 p-0 
                    resize-none overflow-hidden scrollbar-hide
                    input
                    min-h-[40px]
                  "
                />
                <div className="mt-2 flex justify-end">
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      className="
                        bg-transparent border-none
                        text-error-text
                        cursor-pointer text-base
                        p-2 rounded-lg w-8 h-8
                        flex items-center justify-center
                        hover:bg-error-bg transition-colors
                      "
                      onClick={() => onRemoveInstruction(index)}
                    >
                      <RiDeleteBin6Line className="text-accent" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="
              flex items-center
              bg-transparent
              text-accent
              px-4 py-2 rounded-lg
              cursor-pointer text-sm
              hover:bg-accent-bg
              transition-colors duration-700
            "
            onClick={onAddInstruction}
          >
            <MdAddCircleOutline className="mr-1 inline text-md" /> Add Step
          </button>
        </div>
      </div>
    </section>
  );
}