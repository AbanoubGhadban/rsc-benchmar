// Orders - React Server Component
// Order history list

import { getOrders, getCategoryHierarchy, formatPrice } from '@/lib/data';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface OrdersProps {
  searchParams?: {
    page?: string;
  };
}

const Orders = async ({ searchParams = {} }: OrdersProps) => {
  const page = parseInt(searchParams.page || '1');

  const [ordersResult, categories] = await Promise.all([
    getOrders(page, 10),
    getCategoryHierarchy(),
  ]);

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
          <span style={{ color: '#1e293b' }}>Orders</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '48px' }}>
          {/* Sidebar */}
          <aside>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="/account" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Dashboard</a>
              <a href="/account/orders" style={{ padding: '12px 16px', background: '#eff6ff', color: '#3b82f6', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>Orders</a>
              <a href="/account/wishlist" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Wishlist</a>
              <a href="/account/addresses" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Addresses</a>
            </nav>
          </aside>

          {/* Main */}
          <main>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '32px' }}>
              Order History ({ordersResult.total} orders)
            </h1>

            {ordersResult.items.length > 0 ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {ordersResult.items.map(order => (
                    <div
                      key={order.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Order Header */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        gap: '24px',
                        padding: '16px 20px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase' }}>Order Number</p>
                          <p style={{ fontWeight: 600, margin: 0 }}>{order.orderNumber}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase' }}>Date</p>
                          <p style={{ margin: 0 }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase' }}>Status</p>
                          <span style={{
                            padding: '4px 10px',
                            background: order.status === 'delivered' ? '#dcfce7' : order.status === 'shipped' ? '#dbeafe' : '#fef9c3',
                            color: order.status === 'delivered' ? '#16a34a' : order.status === 'shipped' ? '#2563eb' : '#ca8a04',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}>
                            {order.status}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase' }}>Total</p>
                          <p style={{ fontWeight: 600, margin: 0 }}>{formatPrice(order.total)}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                          {order.items.slice(0, 3).map(item => (
                            <div key={item.id} style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div style={{
                              width: '64px',
                              height: '64px',
                              background: '#f8fafc',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748b',
                              fontWeight: 500
                            }}>
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <a
                          href={`/account/orders/${order.id}`}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          }}
                        >
                          View Order Details →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {ordersResult.totalPages > 1 && (
                  <nav style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
                    {ordersResult.hasPrev && (
                      <a href={`/account/orders?page=${page - 1}`} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', textDecoration: 'none', color: '#1e293b' }}>
                        ← Prev
                      </a>
                    )}
                    <span style={{ padding: '8px 16px', color: '#64748b' }}>
                      Page {page} of {ordersResult.totalPages}
                    </span>
                    {ordersResult.hasNext && (
                      <a href={`/account/orders?page=${page + 1}`} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', textDecoration: 'none', color: '#1e293b' }}>
                        Next →
                      </a>
                    )}
                  </nav>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 0', background: '#f8fafc', borderRadius: '12px' }}>
                <span style={{ fontSize: '4rem' }}>📦</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '24px 0 8px' }}>No orders yet</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>When you place an order, it will appear here.</p>
                <a href="/products" style={{ display: 'inline-block', padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
                  Start Shopping
                </a>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Orders;
