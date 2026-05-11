// Checkout - React Server Component
// Checkout page with shipping, payment forms

import { getCart, getCurrentUser, getCategoryHierarchy, formatPrice } from '@/lib/data';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Checkout = async () => {
  const [cart, user, categories] = await Promise.all([
    getCart(),
    getCurrentUser(),
    getCategoryHierarchy(),
  ]);

  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const defaultAddress = user.addresses.find(a => a.isDefault) || user.addresses[0];

  if (cart.items.length === 0) {
    return (
      <>
        <Header categories={categories} cartItemCount={0} />
        <div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>
          <h1>Your cart is empty</h1>
          <p style={{ color: '#64748b' }}>Add some items before checkout.</p>
          <a href="/products" style={{ color: '#3b82f6' }}>Browse Products</a>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header categories={categories} cartItemCount={cartItemCount} />

      <div className="container" style={{ padding: '32px 0' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/cart" style={{ color: '#64748b', textDecoration: 'none' }}>Cart</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#1e293b' }}>Checkout</span>
        </nav>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px' }}>
          {/* Checkout Form */}
          <form>
            {/* Contact */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Contact Information</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                  />
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Shipping Address</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>First Name</label>
                    <input
                      type="text"
                      defaultValue={user.firstName}
                      style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>Last Name</label>
                    <input
                      type="text"
                      defaultValue={user.lastName}
                      style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>Address</label>
                  <input
                    type="text"
                    defaultValue={defaultAddress?.street}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>Apartment, suite, etc. (optional)</label>
                  <input
                    type="text"
                    defaultValue={defaultAddress?.apartment}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>City</label>
                    <input
                      type="text"
                      defaultValue={defaultAddress?.city}
                      style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>State</label>
                    <input
                      type="text"
                      defaultValue={defaultAddress?.state}
                      style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>ZIP Code</label>
                    <input
                      type="text"
                      defaultValue={defaultAddress?.zip}
                      style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Payment */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Payment</h2>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px' }}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500 }}>CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Place Order • {formatPrice(cart.total)}
            </button>
          </form>

          {/* Order Summary */}
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Order Summary</h2>

            {/* Items */}
            <div style={{ marginBottom: '24px' }}>
              {cart.items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '64px', height: '64px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      {item.product.featuredImageUrl && (
                        <img src={item.product.featuredImageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      background: '#64748b',
                      color: 'white',
                      borderRadius: '50%',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {item.quantity}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, margin: 0, fontSize: '0.875rem' }}>{item.product.name}</p>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.75rem' }}>{item.variant.name}</p>
                  </div>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Subtotal</span>
                <span style={{ fontSize: '0.875rem' }}>{formatPrice(cart.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Shipping</span>
                <span style={{ fontSize: '0.875rem' }}>{cart.shippingTotal === 0 ? 'Free' : formatPrice(cart.shippingTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Tax</span>
                <span style={{ fontSize: '0.875rem' }}>{formatPrice(cart.taxTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem' }}>
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Checkout;
