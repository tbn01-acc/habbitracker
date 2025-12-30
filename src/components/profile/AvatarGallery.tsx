import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// 24 HD avatar options using DiceBear API with different seeds
const AVATAR_OPTIONS = [
  'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6',
  'avatar-7', 'avatar-8', 'avatar-9', 'avatar-10', 'avatar-11', 'avatar-12',
  'avatar-13', 'avatar-14', 'avatar-15', 'avatar-16', 'avatar-17', 'avatar-18',
  'avatar-19', 'avatar-20', 'avatar-21', 'avatar-22', 'avatar-23', 'avatar-24',
];

// Generate avatar URL using DiceBear API
export const getAvatarUrl = (seed: string) => {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

interface AvatarGalleryProps {
  selectedAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
}

export function AvatarGallery({ selectedAvatar, onSelect }: AvatarGalleryProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-2 max-h-64 overflow-y-auto">
      {AVATAR_OPTIONS.map((seed) => {
        const url = getAvatarUrl(seed);
        const isSelected = selectedAvatar === url;
        
        return (
          <button
            key={seed}
            type="button"
            onClick={() => onSelect(url)}
            className={cn(
              "relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all",
              isSelected 
                ? "border-primary ring-2 ring-primary/20" 
                : "border-border hover:border-primary/50"
            )}
          >
            <img 
              src={url} 
              alt={`Avatar ${seed}`}
              className="w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
