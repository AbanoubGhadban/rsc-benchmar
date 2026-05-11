// OrderDetail - React Server Component
// Single order detail page

import { getOrderById, getCategoryHierarchy, formatPrice } from '@/lib/data';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface OrderDetailProps {
  orderId: string;
}

const OrderDetail = async ({ orderId }: OrderDetailProps) => {
  const [order, categories] = await Promise.all([
    getOrderById(orderId),
    getCategoryHierarchy(),
  ]);

  if (!order) {
    return (
      <>
        <Header categories={categories} cartItemCount={0} />
        <div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>
          <h1>Order Not Found</h1>
          <p style={{ color: '#64748b' }}>The order you're looking for doesn't exist.</p>
          <a href="/account/orders" style={{ color: '#3b82f6' }}>Back to Orders</a>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header categories={categories} cartItemCount={0} />

      <div className="container" style={{ padding: '32px 0' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/account" style={{ color: '#64748b', textDecoration: 'none' }}>Account</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/account/orders" style={{ color: '#64748b', textDecoration: 'none' }}>Orders</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#1e293b' }}>{order.orderNumber}</span>
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Order {order.orderNumber}
          </h1>
          <span style={{
            padding: '8px 16px',
            background: order.status === 'delivered' ? '#dcfce7' : order.status === 'shipped' ? '#dbeafe' : '#fef9c3',
            color: order.status === 'delivered' ? '#16a34a' : order.status === 'shipped' ? '#2563eb' : '#ca8a04',
            borderRadius: '999px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'capitalize'
          }}>
            {order.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px' }}>
          {/* Order Items */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Items</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr auto',
                    gap: '20px',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ width: '80px', height: '80px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div>
                    <a
                      href={`/product/${item.productSlug}`}
                      style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}
                    >
                      {item.productName}
                    </a>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>
                      {item.variantName}
                    </p>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>
                      Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600, margin: 0 }}>{formatPrice(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            <div style={{ marginTop: '48px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Shipping Address</h2>
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ fontWeight: 500, margin: '0 0 4px' }}>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p style={{ color: '#64748b', margin: '0 0 4px' }}>{order.shippingAddress.street}</p>
                {order.shippingAddress.apartment && (
                  <p style={{ color: '#64748b', margin: '0 0 4px' }}>{order.shippingAddress.apartment}</p>
                )}
                <p style={{ color: '#64748b', margin: 0 }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p style={{ color: '#64748b', margin: '4px 0 0' }}>{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', position: 'sticky', top: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Order Summary</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748b' }}>Order Date</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748b' }}>Payment</span>
                  <span>•••• {order.payment.last4}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b' }}>Shipping</span>
                  <span>{order.shippingTotal === 0 ? 'Free' : formatPrice(order.shippingTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b' }}>Tax</span>
                  <span>{formatPrice(order.taxTotal)}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#16a34a' }}>
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountTotal)}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem' }}>
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <a
                  href="/account/orders"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: '#1e293b',
                    fontWeight: 500
                  }}
                >
                  ← Back to Orders
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default OrderDetail;
