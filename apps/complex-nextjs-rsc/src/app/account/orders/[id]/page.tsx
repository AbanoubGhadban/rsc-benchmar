// Server Component - Order detail page
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderById, formatPrice } from '@/lib/data';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const showSuccess = sp.success === 'true';

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: 'Account', href: '/account' },
          { label: 'Orders', href: '/account/orders' },
          { label: `#${order.orderNumber}` },
        ]}
      />

      {showSuccess && (
        <div
          style={{
            padding: '16px 24px',
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
            fontWeight: 500,
          }}
        >
          Order placed successfully! Thank you for your purchase.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
            Order #{order.orderNumber}
          </h1>
          <p style={{ color: 'var(--color-text-light)' }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
        <div>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Items</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--color-bg-alt)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                      flexShrink: 0,
                    }}
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link
                      href={`/product/${item.productSlug}`}
                      style={{ fontWeight: 500, textDecoration: 'none', color: 'inherit' }}
                    >
                      {item.productName}
                    </Link>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                      {item.variantName}
                    </div>
                    <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                      Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatPrice(item.totalPrice)}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>
              Shipping Address
            </h2>
            <div
              style={{
                padding: '16px',
                background: 'var(--color-bg-alt)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ fontWeight: 500 }}>
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </div>
              <div style={{ color: 'var(--color-text-light)', marginTop: '4px' }}>
                {order.shippingAddress.street}
                {order.shippingAddress.apartment && `, ${order.shippingAddress.apartment}`}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.zip}
                <br />
                {order.shippingAddress.country}
              </div>
            </div>
          </section>
        </div>

        <aside className="cart-summary">
          <h2 className="summary-title">Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>

          {order.discountTotal > 0 && (
            <div className="summary-row" style={{ color: 'var(--color-success)' }}>
              <span>Discount</span>
              <span>-{formatPrice(order.discountTotal)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span>{order.shippingTotal === 0 ? 'Free' : formatPrice(order.shippingTotal)}</span>
          </div>

          <div className="summary-row">
            <span>Tax</span>
            <span>{formatPrice(order.taxTotal)}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>
              Payment Method
            </div>
            <div style={{ fontWeight: 500 }}>
              •••• •••• •••• {order.payment?.last4 || '4242'}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
