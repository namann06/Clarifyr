import React from 'react';
import { Star } from '@phosphor-icons/react';

export default function StarRating({ rating = 0, max = 5, interactive = false, onChange }) {
  const stars = [];

  for (let i = 1; i <= max; i++) {
    const isFilled = i <= Math.round(rating);
    
    stars.push(
      <Star
        key={i}
        size={interactive ? 22 : 15}
        weight={isFilled ? 'fill' : 'regular'}
        className={`star ${isFilled ? 'filled' : ''} ${interactive ? 'cursor-pointer' : ''}`}
        onClick={() => interactive && onChange && onChange(i)}
        style={{
          cursor: interactive ? 'pointer' : 'default',
          color: isFilled ? 'var(--color-warning)' : 'var(--text-muted)',
          transition: 'all 0.12s ease'
        }}
      />
    );
  }

  return (
    <div className="star-rating">
      {stars}
      {!interactive && rating > 0 && (
        <span className="rating-value" style={{ marginLeft: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}
