import React from 'react';
import { icons3D, Icon3DKey } from '@/assets/icons';
import { cn } from '@/lib/utils';

export type { Icon3DKey };

interface Icon3DProps {
  name: Icon3DKey;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
};

export function Icon3D({ name, size = 'md', className }: Icon3DProps) {
  const iconSrc = icons3D[name];
  
  if (!iconSrc) {
    console.warn(`Icon3D: Unknown icon "${name}"`);
    return null;
  }

  return (
    <img
      src={iconSrc}
      alt={name}
      className={cn(sizeClasses[size], 'object-contain', className)}
    />
  );
}
