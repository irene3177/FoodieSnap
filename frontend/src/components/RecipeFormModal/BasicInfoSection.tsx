import { MdOutlineRestaurantMenu } from 'react-icons/md';

interface BasicInfoSectionProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function BasicInfoSection({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: BasicInfoSectionProps) {
  return (
    <section className="space-y-4 p-6 border rounded-xl mb-8">
      <div className="flex items-center gap-2 mb-2">
        <MdOutlineRestaurantMenu className="text-accent text-xl" />
        <h2 className="text-secondary text-2xl cursor-default">Basic Information</h2>
      </div>
      <div className="space-y-4">
        <div className="group">
          <label className="block mb-2 font-medium text-md text-muted">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter recipe title"
            className="input"
            required
          />
        </div>
        <div className="group">
          <label className="block mb-2 font-medium text-md text-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief description of your recipe"
            rows={3}
            className="
              input resize-none
              overflow-y-auto
              min-h-[80px] max-h-[200px]
            "
          />
        </div>
      </div>
    </section>
  );
}