'use client';

import { useState } from 'react';

interface WishlistButtonProps {
  productId: string;
  initialWishlisted?: boolean;
}

export function WishlistButton({ productId, initialWishlisted = false }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      setWishlisted(!wishlisted);
    } catch (err) {
      console.error('Failed to update wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleToggle}
      disabled={loading}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {wishlisted ? '❤️' : '🤍'}
    </button>
  );
}
