import { MdOutlineImage, MdOutlineAddAPhoto } from 'react-icons/md';

interface MediaSectionProps {
  imageUrl: string;
  onImageUrlChange: (value: string) => void;
}

export function MediaSection({ imageUrl, onImageUrlChange }: MediaSectionProps) {
  return (
    <section className="p-6 space-y-4 border rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <MdOutlineImage className="text-accent text-xl" />
        <h2 className="text-secondary text-2xl cursor-default">Recipe Image</h2>
      </div>
      <div className="space-y-4">
        <div className="
          aspect-video w-full rounded-lg flex items-center justify-center cursor-pointer
          border border-dashed border-outline/30 overflow-hidden relative">
            <img
              className="object-cover w-full h-full opacity-60"
              data-alt="A cinematic, high-end close-up shot of a perfectly seared salmon fillet glazed with golden smoked honey and garnished with fresh rosemary sprigs. "
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBR7PQRqecIrdr8inFxs9bgGVnvE3AfWZOorVmA9PLvRkJlXt16Vk_AetnCdrhZ50BrbB00LB4zulPGstwT9C8fUC6AtWqZRY2nPajo3tfCBWIeIvfxWGvx1YvgbtJtrXIHi_hJPLSnv7AqueGbjPTKJjDxScUGJBvYRmokRHZg1404ON1urRrBrdErUIa6TDBLLKkInW0norcfzeoLepBWquJ7kgAkzdH3X1k0hcG3bs-aSJDtwB3i"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <MdOutlineAddAPhoto className="text-4xl mb-2 text-secondary" />
              <span className="text-secondary">Click to upload or drag &amp; drop</span>
            </div>
        </div>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder="Or paste image URL..."
          className="input"
        />
      </div>
    </section>
  );
}