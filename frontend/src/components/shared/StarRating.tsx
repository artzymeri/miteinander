'use client';

import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';

/**
 * Renders a read-only star display that supports half-star increments.
 * E.g. rating=3.5 renders 3 full stars, 1 half star, 1 empty star.
 */
export function StarDisplay({
  rating,
  size = 'sm',
  className = '',
}: {
  rating: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };
  const iconSize = sizeClasses[size];

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  // If the fractional part is >= 0.75, round up to full
  const adjustedFull = rating - fullStars >= 0.75 ? fullStars + 1 : fullStars;
  const adjustedEmpty = 5 - adjustedFull - (hasHalf ? 1 : 0);

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {/* Full stars */}
      {Array.from({ length: adjustedFull }).map((_, i) => (
        <Star key={`full-${i}`} className={`${iconSize} text-amber-400 fill-amber-400`} />
      ))}
      {/* Half star */}
      {hasHalf && (
        <div className="relative">
          <Star className={`${iconSize} text-gray-200`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${iconSize} text-amber-400 fill-amber-400`} />
          </div>
        </div>
      )}
      {/* Empty stars */}
      {Array.from({ length: adjustedEmpty }).map((_, i) => (
        <Star key={`empty-${i}`} className={`${iconSize} text-gray-200`} />
      ))}
    </div>
  );
}

/**
 * Interactive star rating input supporting 0.5 increments.
 * Hovering over the left half of a star selects x.5, right half selects x.0.
 */
export function StarRatingInput({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };
  const iconSize = sizeClasses[size];

  const displayValue = hoverValue || value;

  const handleMouseMove = useCallback(
    (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isLeftHalf = x < rect.width / 2;
      setHoverValue(isLeftHalf ? star - 0.5 : star);
    },
    []
  );

  const handleClick = useCallback(
    (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isLeftHalf = x < rect.width / 2;
      onChange(isLeftHalf ? star - 0.5 : star);
    },
    [onChange]
  );

  const renderStar = (star: number) => {
    const full = displayValue >= star;
    const half = !full && displayValue >= star - 0.5;

    if (full) {
      return <Star className={`${iconSize} text-amber-400 fill-amber-400 transition-colors`} />;
    }

    if (half) {
      return (
        <div className="relative">
          <Star className={`${iconSize} text-gray-300 transition-colors`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${iconSize} text-amber-400 fill-amber-400 transition-colors`} />
          </div>
        </div>
      );
    }

    return <Star className={`${iconSize} text-gray-300 transition-colors`} />;
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseMove={(e) => handleMouseMove(star, e)}
          onMouseLeave={() => setHoverValue(0)}
          onClick={(e) => handleClick(star, e)}
          className="p-0.5 cursor-pointer transition-transform hover:scale-110"
        >
          {renderStar(star)}
        </button>
      ))}
      {(hoverValue > 0 || value > 0) && (
        <span className="ml-2 text-sm text-gray-500">
          {(hoverValue || value).toFixed(1)}/5
        </span>
      )}
    </div>
  );
}
