// Cart - React Server Component
// Shopping cart page with items and totals

import { getCart, getCategoryHierarchy, formatPrice } from '@/lib/data';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Cart = async () => {
  const [cart, categories] = await Promise.all([
    getCart(),
    getCategoryHierarchy(),
  ]);

  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Header categories={categories} cartItemCount={cartItemCount} />

      <div className="container" style={{ padding: '32px 0' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#1e293b' }}>Shopping Cart</span>
        </nav>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>
          Shopping Cart ({cartItemCount} items)
        </h1>

        {cart.items.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '48px' }}>
            {/* Cart Items */}
            <div>
              {cart.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr auto',
                    gap: '24px',
                    padding: '24px 0',
                    borderBottom: '1px solid #e2e8f0',
                    alignItems: 'center'
                  }}
                >
                  {/* Image */}
                  <div style={{ background: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
                    {item.product.featuredImageUrl ? (
                      <img
                        src={item.product.featuredImageUrl}
                        alt={item.product.name}
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        📦
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <a
                      href={`/product/${item.product.slug}`}
                      style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 600, fontSize: '1.125rem' }}
                    >
                      {item.product.name}
                    </a>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>
                      {item.variant.name}
                    </p>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>
                      {formatPrice(item.unitPrice)} each
                    </p>

                    {/* Quantity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <button style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}>-</button>
                        <span style={{ padding: '0 12px', minWidth: '32px', textAlign: 'center' }}>{item.quantity}</span>
                        <button style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}>+</button>
                      </div>
                      <button style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600, fontSize: '1.125rem', margin: 0 }}>
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Order Summary</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Shipping</span>
                  <span>{cart.shippingTotal === 0 ? 'Free' : formatPrice(cart.shippingTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Tax</span>
                  <span>{formatPrice(cart.taxTotal)}</span>
                </div>
                {cart.discountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Discount</span>
                    <span>-{formatPrice(cart.discountTotal)}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem' }}>
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              <a
                href="/checkout"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Proceed to Checkout
              </a>

              <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '16px' }}>
                {cart.subtotal >= 50 && '✓ You qualify for free shipping!'}
                {cart.subtotal < 50 && `Add ${formatPrice(50 - cart.subtotal)} more for free shipping`}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <span style={{ fontSize: '4rem' }}>🛒</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '24px 0 8px' }}>Your cart is empty</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Looks like you haven't added any items yet.</p>
            <a
              href="/products"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Start Shopping
            </a>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default Cart;
