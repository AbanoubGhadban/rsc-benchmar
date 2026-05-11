'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@shared/types';
import { formatPrice } from '@/lib/format';

interface WishlistItemProps {
  item: Product;
}

export function WishlistItem({ item }: WishlistItemProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setLoading(true);
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.id, action: 'remove' }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.id,
          variantId: item.id + '-default',
          quantity: 1,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        opacity: loading ? 0.5 : 1,
      }}
    >
      <Link href={`/product/${item.slug}`} style={{ display: 'block' }}>
        <div
          style={{
            aspectRatio: '1',
            background: 'var(--color-bg-alt)',
          }}
        >
          {item.featuredImageUrl && (
            <img
              src={item.featuredImageUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      </Link>

      <div style={{ padding: '16px' }}>
        <Link
          href={`/product/${item.slug}`}
          style={{
            fontWeight: 500,
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          {item.name}
        </Link>
        <div style={{ fontWeight: 700, marginBottom: '12px' }}>
          {formatPrice(item.basePrice)}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddToCart}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Add to Cart
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRemove}
            disabled={loading}
            style={{ color: 'var(--color-error)' }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
