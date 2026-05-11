'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { formatPrice } from '@/lib/format';
import type { Cart } from '@shared/types';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/cart')
      .then(res => res.json())
      .then(data => {
        if (data.items.length === 0) {
          router.push('/cart');
        } else {
          setCart(data);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !cart) {
    return (
      <div className="container checkout-page" style={{ textAlign: 'center', padding: '48px 0' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <Breadcrumb items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Checkout</h1>

      <div className="checkout-layout">
        <CheckoutForm />

        <aside className="cart-summary">
          <h2 className="summary-title">Order Summary</h2>

          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px' }}>
            {cart.items.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'var(--color-bg-alt)',
                    borderRadius: 'var(--radius-md)',
                    flexShrink: 0,
                  }}
                >
                  {item.variant.imageUrl && (
                    <img
                      src={item.variant.imageUrl}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.product.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    {item.variant.name} × {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>{formatPrice(item.totalPrice)}</div>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>

          {cart.discountTotal > 0 && (
            <div className="summary-row" style={{ color: 'var(--color-success)' }}>
              <span>Discount</span>
              <span>-{formatPrice(cart.discountTotal)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span>{cart.shippingTotal === 0 ? 'Free' : formatPrice(cart.shippingTotal)}</span>
          </div>

          <div className="summary-row">
            <span>Tax</span>
            <span>{formatPrice(cart.taxTotal)}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
