// Server Component - Footer
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/products">All Products</a></li>
              <li><a href="/category/electronics">Electronics</a></li>
              <li><a href="/category/office">Office</a></li>
              <li><a href="/category/accessories">Accessories</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <ul>
              <li><a href="/account">My Account</a></li>
              <li><a href="/account/orders">Orders</a></li>
              <li><a href="/account/wishlist">Wishlist</a></li>
              <li><a href="/account/addresses">Addresses</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Help</h4>
            <ul>
              <li><a href="#">Shipping</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>About</h4>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
              RSC Shop is a demo e-commerce site built with React Server Components.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 RSC Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
