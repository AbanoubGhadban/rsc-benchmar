// Wishlist - React Server Component
// User's wishlist page

import { getWishlist, getCategoryHierarchy, formatPrice, getProductRating } from '@/lib/data';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Wishlist = async () => {
  const [wishlist, categories] = await Promise.all([
    getWishlist(),
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
          <span style={{ color: '#1e293b' }}>Wishlist</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '48px' }}>
          {/* Sidebar */}
          <aside>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="/account" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Dashboard</a>
              <a href="/account/orders" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Orders</a>
              <a href="/account/wishlist" style={{ padding: '12px 16px', background: '#eff6ff', color: '#3b82f6', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>Wishlist</a>
              <a href="/account/addresses" style={{ padding: '12px 16px', color: '#64748b', borderRadius: '8px', textDecoration: 'none' }}>Addresses</a>
            </nav>
          </aside>

          {/* Main */}
          <main>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '32px' }}>
              My Wishlist ({wishlist.length} items)
            </h1>

            {wishlist.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {wishlist.map(product => {
                  const rating = getProductRating(product.id);
                  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.basePrice;

                  return (
                    <div
                      key={product.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: 'white'
                      }}
                    >
                      <a href={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ position: 'relative', aspectRatio: '1', background: '#f8fafc' }}>
                          {product.featuredImageUrl ? (
                            <img src={product.featuredImageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                              📦
                            </div>
                          )}
                          {isOnSale && (
                            <span style={{
                              position: 'absolute',
                              top: '12px',
                              left: '12px',
                              background: '#dc2626',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}>
                              Sale
                            </span>
                          )}
                        </div>
                        <div style={{ padding: '16px' }}>
                          <h3 style={{ fontWeight: 600, margin: '0 0 8px', fontSize: '1rem' }}>{product.name}</h3>
                          {rating.count > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#fbbf24', fontSize: '0.875rem' }}>
                                {'★'.repeat(Math.round(rating.average))}
                                {'☆'.repeat(5 - Math.round(rating.average))}
                              </span>
                              <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '4px' }}>
                                ({rating.count})
                              </span>
                            </div>
                          )}
                          <div>
                            <span style={{ fontWeight: 600 }}>{formatPrice(product.basePrice)}</span>
                            {isOnSale && (
                              <span style={{ color: '#94a3b8', textDecoration: 'line-through', marginLeft: '8px', fontSize: '0.875rem' }}>
                                {formatPrice(product.compareAtPrice!)}
                              </span>
                            )}
                          </div>
                        </div>
                      </a>
                      <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px' }}>
                        <button style={{
                          flex: 1,
                          padding: '10px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}>
                          Add to Cart
                        </button>
                        <button style={{
                          padding: '10px',
                          background: 'transparent',
                          color: '#dc2626',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 0', background: '#f8fafc', borderRadius: '12px' }}>
                <span style={{ fontSize: '4rem' }}>♡</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '24px 0 8px' }}>Your wishlist is empty</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Save items you love to buy them later.</p>
                <a href="/products" style={{ display: 'inline-block', padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
                  Browse Products
                </a>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Wishlist;
