// Server Component - Wishlist page
import Link from 'next/link';
import { getWishlist, formatPrice } from '@/lib/data';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { WishlistItem } from '@/components/account/WishlistItem';

export default async function WishlistPage() {
  const wishlist = await getWishlist();

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Account', href: '/account' }, { label: 'Wishlist' }]} />

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>
        My Wishlist ({wishlist.length} items)
      </h1>

      {wishlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <h2 className="empty-state-title">Your wishlist is empty</h2>
          <p className="empty-state-description">
            Save items you love to your wishlist for later.
          </p>
          <Link href="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {wishlist.map(item => (
            <WishlistItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
