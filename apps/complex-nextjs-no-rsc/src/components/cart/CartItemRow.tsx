'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CartItem } from '@shared/types';
import { formatPrice } from '@/lib/format';

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateQuantity = async (quantity: number) => {
    setLoading(true);
    try {
      await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, quantity }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to update cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async () => {
    setLoading(true);
    try {
      await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-item" style={{ opacity: loading ? 0.5 : 1 }}>
      <div className="cart-item-image">
        {(item.variant.imageUrl || item.product.featuredImageUrl) && (
          <img
            src={item.variant.imageUrl || item.product.featuredImageUrl || ''}
            alt={item.product.name}
          />
        )}
      </div>

      <div className="cart-item-details">
        <Link href={`/product/${item.product.slug}`} className="cart-item-name">
          {item.product.name}
        </Link>
        <div className="cart-item-variant">{item.variant.name}</div>
        <div className="cart-item-price">{formatPrice(item.unitPrice)}</div>

        <div className="cart-item-actions">
          <div className="quantity-selector">
            <button
              className="quantity-btn"
              onClick={() => updateQuantity(item.quantity - 1)}
              disabled={loading || item.quantity <= 1}
            >
              -
            </button>
            <span className="quantity-value">{item.quantity}</span>
            <button
              className="quantity-btn"
              onClick={() => updateQuantity(item.quantity + 1)}
              disabled={loading}
            >
              +
            </button>
          </div>

          <button
            className="btn btn-ghost"
            onClick={removeItem}
            disabled={loading}
            style={{ color: 'var(--color-error)' }}
          >
            Remove
          </button>
        </div>
      </div>

      <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
        {formatPrice(item.totalPrice)}
      </div>
    </div>
  );
}
