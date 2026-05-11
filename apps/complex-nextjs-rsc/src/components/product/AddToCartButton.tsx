'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  variantId: string;
  disabled?: boolean;
}

export function AddToCartButton({ variantId, disabled }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
      <div className="quantity-selector">
        <button
          className="quantity-btn"
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          disabled={disabled}
        >
          -
        </button>
        <span className="quantity-value">{quantity}</span>
        <button
          className="quantity-btn"
          onClick={() => setQuantity(q => q + 1)}
          disabled={disabled}
        >
          +
        </button>
      </div>

      <button
        className="btn btn-primary btn-lg"
        onClick={handleAddToCart}
        disabled={disabled || loading}
        style={{ flex: 1 }}
      >
        {loading ? 'Adding...' : disabled ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
}
