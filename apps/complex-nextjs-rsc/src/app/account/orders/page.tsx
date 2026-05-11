// Server Component - Orders list page
import Link from 'next/link';
import { getOrders, formatPrice } from '@/lib/data';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';

interface OrdersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);
  const result = await getOrders(page, 10);

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Account', href: '/account' }, { label: 'Orders' }]} />

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Order History</h1>

      {result.items.length === 0 ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {result.items.map(order => (
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

          {result.totalPages > 1 && (
            <Pagination currentPage={result.page} totalPages={result.totalPages} />
          )}
        </>
      )}
    </div>
  );
}
