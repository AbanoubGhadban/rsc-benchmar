// Server Component - Account dashboard
import Link from 'next/link';
import { getCurrentUser, getOrders, formatPrice } from '@/lib/data';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default async function AccountPage() {
  const [user, ordersResult] = await Promise.all([
    getCurrentUser(),
    getOrders(1, 3),
  ]);

  return (
    <div className="container account-page">
      <Breadcrumb items={[{ label: 'Account' }]} />

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>My Account</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <section className="account-card">
          <h2 className="account-card-title">Profile</h2>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 500 }}>{user.firstName} {user.lastName}</div>
            <div style={{ color: 'var(--color-text-light)' }}>{user.email}</div>
          </div>
          <Link href="/account/profile" className="btn btn-secondary btn-sm">
            Edit Profile
          </Link>
        </section>

        <section className="account-card">
          <h2 className="account-card-title">Recent Orders</h2>
          {ordersResult.items.length === 0 ? (
            <p style={{ color: 'var(--color-text-light)' }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ordersResult.items.map(order => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'var(--color-bg-alt)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>#{order.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{formatPrice(order.total)}</div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: order.status === 'delivered' ? 'var(--color-success)' : 'var(--color-text-light)',
                      }}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/account/orders"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px' }}
          >
            View All Orders
          </Link>
        </section>

        <section className="account-card">
          <h2 className="account-card-title">Addresses</h2>
          {user.addresses.length === 0 ? (
            <p style={{ color: 'var(--color-text-light)' }}>No addresses saved</p>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              {user.addresses.slice(0, 1).map(addr => (
                <div key={addr.id} style={{ fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 500 }}>{addr.label}</div>
                  <div style={{ color: 'var(--color-text-light)' }}>
                    {addr.street}, {addr.city}, {addr.state} {addr.zip}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/account/addresses" className="btn btn-secondary btn-sm">
            Manage Addresses
          </Link>
        </section>

        <section className="account-card">
          <h2 className="account-card-title">Wishlist</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '16px' }}>
            Save items for later
          </p>
          <Link href="/account/wishlist" className="btn btn-secondary btn-sm">
            View Wishlist
          </Link>
        </section>
      </div>
    </div>
  );
}
