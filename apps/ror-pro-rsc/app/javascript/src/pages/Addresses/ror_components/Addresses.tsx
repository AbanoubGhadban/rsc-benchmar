// Addresses - React Server Component
// User's saved addresses

import { getCurrentUser, getCategoryHierarchy } from '@/lib/data';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Addresses = async () => {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
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
          <span style={{ color: '#1e293b' }}>Addresses</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '48px' }}>
          {/* Sidebar */}
          <aside>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="/account" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Dashboard</a>
              <a href="/account/orders" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Orders</a>
              <a href="/account/wishlist" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Wishlist</a>
              <a href="/account/addresses" style={{ padding: '12px 16px', background: '#eff6ff', color: '#3b82f6', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>Addresses</a>
            </nav>
          </aside>

          {/* Main */}
          <main>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                Saved Addresses ({user.addresses.length})
              </h1>
              <button style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}>
                + Add New Address
              </button>
            </div>

            {user.addresses.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                {user.addresses.map(address => (
                  <div
                    key={address.id}
                    style={{
                      padding: '24px',
                      border: address.isDefault ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      background: 'white',
                      position: 'relative'
                    }}
                  >
                    {address.isDefault && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '4px 8px',
                        background: '#eff6ff',
                        color: '#3b82f6',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        Default
                      </span>
                    )}

                    <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>{address.label}</h3>
                    <p style={{ color: '#64748b', margin: '0 0 4px', lineHeight: 1.6 }}>
                      {address.street}
                    </p>
                    {address.apartment && (
                      <p style={{ color: '#64748b', margin: '0 0 4px', lineHeight: 1.6 }}>
                        {address.apartment}
                      </p>
                    )}
                    <p style={{ color: '#64748b', margin: '0 0 4px', lineHeight: 1.6 }}>
                      {address.city}, {address.state} {address.zip}
                    </p>
                    <p style={{ color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                      {address.country}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        color: '#3b82f6',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}>
                        Edit
                      </button>
                      {!address.isDefault && (
                        <>
                          <button style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}>
                            Set as Default
                          </button>
                          <button style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            color: '#dc2626',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 0', background: '#f8fafc', borderRadius: '12px' }}>
                <span style={{ fontSize: '4rem' }}>📍</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '24px 0 8px' }}>No saved addresses</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Add an address for faster checkout.</p>
                <button style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Add Your First Address
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Addresses;
