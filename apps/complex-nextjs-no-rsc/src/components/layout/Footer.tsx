// Server Component
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">RSC Shop</div>
            <p className="footer-description">
              Premium e-commerce experience built with React Server Components.
              Fast, secure, and scalable.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Shop</h4>
            <ul className="footer-links">
              <li><Link href="/category/electronics">Electronics</Link></li>
              <li><Link href="/category/office">Office</Link></li>
              <li><Link href="/category/accessories">Accessories</Link></li>
              <li><Link href="/category/audio">Audio</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Account</h4>
            <ul className="footer-links">
              <li><Link href="/account">My Account</Link></li>
              <li><Link href="/account/orders">Orders</Link></li>
              <li><Link href="/account/wishlist">Wishlist</Link></li>
              <li><Link href="/account/addresses">Addresses</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Help</h4>
            <ul className="footer-links">
              <li><Link href="/help/shipping">Shipping</Link></li>
              <li><Link href="/help/returns">Returns</Link></li>
              <li><Link href="/help/faq">FAQ</Link></li>
              <li><Link href="/help/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} RSC Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
