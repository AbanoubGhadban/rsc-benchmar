// Server Component - Header
import type { Category, Cart } from '@shared/types';

interface HeaderProps {
  categories: (Category & { children: Category[] })[];
  cartItemCount: number;
}

export function Header({ categories, cartItemCount }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="/" className="logo">RSC Shop</a>

        <nav className="main-nav">
          {categories.slice(0, 5).map(cat => (
            <a key={cat.id} href={`/category/${cat.slug}`} className="nav-link">
              {cat.name}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <form action="/search" method="get" className="search-form">
            <input type="text" name="q" placeholder="Search..." className="search-input" />
            <button type="submit" className="search-btn">🔍</button>
          </form>
          <a href="/cart" className="cart-icon">
            🛒 {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>}
          </a>
          <a href="/account" className="icon-btn" aria-label="Account">
            👤
          </a>
        </div>
      </div>
    </header>
  );
}
