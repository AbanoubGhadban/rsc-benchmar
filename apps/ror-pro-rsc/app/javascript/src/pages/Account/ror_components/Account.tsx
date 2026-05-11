// Account - React Server Component
// Account dashboard with recent orders and user info

import { getCurrentUser, getOrders, getCategoryHierarchy, formatPrice } from '@/lib/data';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Account = async () => {
  const [user, ordersResult, categories] = await Promise.all([
    getCurrentUser(),
    getOrders(1, 5),
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
          <span style={{ color: '#1e293b' }}>My Account</span>
        </nav>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>My Account</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '48px' }}>
          {/* Sidebar Navigation */}
          <aside>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a
                href="/account"
                style={{
                  padding: '12px 16px',
                  background: '#eff6ff',
                  color: '#3b82f6',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                Dashboard
              </a>
              <a
                href="/account/orders"
                style={{
                  padding: '12px 16px',
                  color: '#64748b',
                  borderRadius: '8px',
                  textDecoration: 'none'
                }}
              >
                Orders
              </a>
              <a
                href="/account/wishlist"
                style={{
                  padding: '12px 16px',
                  color: '#64748b',
                  borderRadius: '8px',
                  textDecoration: 'none'
                }}
              >
                Wishlist
              </a>
              <a
                href="/account/addresses"
                style={{
                  padding: '12px 16px',
                  color: '#64748b',
                  borderRadius: '8px',
                  textDecoration: 'none'
                }}
              >
                Addresses
              </a>
            </nav>
          </aside>

          {/* Main Content */}
          <main>
            {/* Welcome */}
            <section style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>
                Welcome back, {user.firstName}!
              </h2>
              <p style={{ color: '#64748b' }}>
                From your account dashboard you can view your recent orders, manage your shipping addresses, and edit your account details.
              </p>
            </section>

            {/* Quick Stats */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px', color: '#3b82f6' }}>
                  {ordersResult.total}
                </p>
                <p style={{ color: '#64748b', margin: 0 }}>Total Orders</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px', color: '#16a34a' }}>
                  {user.addresses.length}
                </p>
                <p style={{ color: '#64748b', margin: 0 }}>Saved Addresses</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px', color: '#f59e0b' }}>
                  6
                </p>
                <p style={{ color: '#64748b', margin: 0 }}>Wishlist Items</p>
              </div>
            </section>

            {/* Recent Orders */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Recent Orders</h2>
                <a href="/account/orders" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
                  View All →
                </a>
              </div>

              {ordersResult.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {ordersResult.items.slice(0, 5).map(order => (
                    <a
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: '24px',
                        padding: '20px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: 'inherit',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{order.orderNumber}</p>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
                          {order.items.length} items • {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span style={{
                          padding: '6px 12px',
                          background: order.status === 'delivered' ? '#dcfce7' : '#fef9c3',
                          color: order.status === 'delivered' ? '#16a34a' : '#ca8a04',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {order.status}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 600, margin: 0 }}>{formatPrice(order.total)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px', background: '#f8fafc', borderRadius: '12px' }}>
                  <p style={{ color: '#64748b' }}>No orders yet.</p>
                  <a href="/products" style={{ color: '#3b82f6' }}>Start Shopping</a>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Account;
