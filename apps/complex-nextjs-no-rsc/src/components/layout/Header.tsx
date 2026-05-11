// Server Component
import Link from 'next/link';
import { getCategoryHierarchy, getCart } from '@/lib/data';
import { SearchBar } from './SearchBar';
import { CartIcon } from './CartIcon';

export async function Header() {
  const [categories, cart] = await Promise.all([
    getCategoryHierarchy(),
    getCart(),
  ]);

  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">RSC Shop</Link>

        <nav className="main-nav">
          {categories.slice(0, 5).map(cat => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="nav-link">
              {cat.name}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <SearchBar />
          <CartIcon count={cartItemCount} />
          <Link href="/account" className="icon-btn" aria-label="Account">
            👤
          </Link>
        </div>
      </div>
    </header>
  );
}
