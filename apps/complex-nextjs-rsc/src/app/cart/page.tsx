// Server Component - Cart page
import Link from 'next/link';
import { getCart, formatPrice } from '@/lib/data';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default async function CartPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="container cart-page">
        <Breadcrumb items={[{ label: 'Cart' }]} />
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h2 className="empty-state-title">Your cart is empty</h2>
          <p className="empty-state-description">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link href="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <Breadcrumb items={[{ label: 'Cart' }]} />

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>
        Shopping Cart ({cart.items.length} items)
      </h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map(item => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <aside className="cart-summary">
          <h2 className="summary-title">Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>

          {cart.discountTotal > 0 && (
            <div className="summary-row" style={{ color: 'var(--color-success)' }}>
              <span>Discount</span>
              <span>-{formatPrice(cart.discountTotal)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span>{cart.shippingTotal === 0 ? 'Free' : formatPrice(cart.shippingTotal)}</span>
          </div>

          <div className="summary-row">
            <span>Tax</span>
            <span>{formatPrice(cart.taxTotal)}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>

          <Link
            href="/checkout"
            className="btn btn-primary btn-lg btn-full"
            style={{ marginTop: '24px' }}
          >
            Proceed to Checkout
          </Link>

          <Link
            href="/products"
            className="btn btn-secondary btn-full"
            style={{ marginTop: '12px' }}
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
