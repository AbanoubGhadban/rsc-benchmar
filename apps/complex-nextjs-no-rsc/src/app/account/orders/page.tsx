'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import { formatPrice } from '@/lib/format';
import type { Order, PaginatedResult } from '@shared/types';

function OrdersContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PaginatedResult<Order> | null>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/orders?page=${page}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading && !data) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 0' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Account', href: '/account' }, { label: 'Orders' }]} />

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Order History</h1>

      {data.items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h2 className="empty-state-title">No orders yet</h2>
          <p className="empty-state-description">
            Once you place an order, it will appear here.
          </p>
          <Link href="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: loading ? 0.5 : 1 }}>
            {data.items.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="order-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '20px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      Order #{order.orderNumber}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                      {formatPrice(order.total)}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background:
                          order.status === 'delivered'
                            ? 'var(--color-success-bg)'
                            : order.status === 'cancelled'
                            ? 'var(--color-error-bg)'
                            : 'var(--color-bg-alt)',
                        color:
                          order.status === 'delivered'
                            ? 'var(--color-success)'
                            : order.status === 'cancelled'
                            ? 'var(--color-error)'
                            : 'var(--color-text)',
                      }}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data.totalPages > 1 && (
            <Pagination currentPage={data.page} totalPages={data.totalPages} />
          )}
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', padding: '48px 0' }}>Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
