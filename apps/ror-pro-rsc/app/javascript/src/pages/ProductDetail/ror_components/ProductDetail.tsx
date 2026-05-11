// ProductDetail - React Server Component
// Product detail page with variants, reviews, related products

import {
  getProductBySlug,
  getProductVariants,
  getProductReviews,
  getRelatedProducts,
  getCategoryHierarchy,
  formatPrice,
  getProductRating,
  getVariantStock
} from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface ProductDetailProps {
  slug: string;
}

const ProductDetail = async ({ slug }: ProductDetailProps) => {
  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>
        <h1>Product Not Found</h1>
        <p>The product you're looking for doesn't exist.</p>
        <a href="/products" style={{ color: '#3b82f6' }}>Back to Products</a>
      </div>
    );
  }

  const [variants, reviews, related, categories] = await Promise.all([
    getProductVariants(product.id),
    getProductReviews(product.id, 5),
    getRelatedProducts(product.id, product.categoryId, 4),
    getCategoryHierarchy(),
  ]);

  const rating = getProductRating(product.id);
  const defaultVariant = variants[0];
  const stock = defaultVariant ? await getVariantStock(defaultVariant.id) : 0;
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const discount = isOnSale ? Math.round((1 - product.basePrice / product.compareAtPrice!) * 100) : 0;

  return (
    <>
      <Header categories={categories} cartItemCount={0} />

      <div className="container" style={{ padding: '32px 0' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <a href="/products" style={{ color: '#64748b', textDecoration: 'none' }}>Products</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#1e293b' }}>{product.name}</span>
        </nav>

        {/* Product Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '64px' }}>
          {/* Image Gallery */}
          <div>
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '1/1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {product.featuredImageUrl ? (
                <img
                  src={product.featuredImageUrl}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '4rem' }}>📦</span>
              )}
            </div>

            {/* Thumbnail gallery */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              {variants.slice(0, 4).map((variant, i) => (
                <div
                  key={variant.id}
                  style={{
                    width: '80px',
                    height: '80px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: i === 0 ? '2px solid #3b82f6' : '2px solid transparent',
                    overflow: 'hidden'
                  }}
                >
                  {variant.imageUrl && (
                    <img src={variant.imageUrl} alt={variant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Tags */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {product.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 16px' }}>{product.name}</h1>

            {/* Rating */}
            {rating.count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ color: '#fbbf24' }}>
                  {'★'.repeat(Math.round(rating.average))}
                  {'☆'.repeat(5 - Math.round(rating.average))}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  {rating.average.toFixed(1)} ({rating.count} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>
                {formatPrice(product.basePrice)}
              </span>
              {isOnSale && (
                <>
                  <span style={{ fontSize: '1.25rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '12px' }}>
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                  <span style={{
                    marginLeft: '12px',
                    padding: '4px 8px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '24px' }}>
              {product.description}
            </p>

            {/* Variants */}
            {variants.length > 1 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>Options</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {variants.map((variant, i) => (
                    <button
                      key={variant.id}
                      style={{
                        padding: '8px 16px',
                        border: i === 0 ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: i === 0 ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div style={{ marginBottom: '24px' }}>
              {stock > 0 ? (
                <span style={{ color: '#16a34a', fontWeight: 500 }}>
                  ✓ In Stock ({stock} available)
                </span>
              ) : (
                <span style={{ color: '#dc2626', fontWeight: 500 }}>
                  ✗ Out of Stock
                </span>
              )}
            </div>

            {/* Add to Cart */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <button style={{ padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.25rem' }}>-</button>
                <span style={{ padding: '0 16px', minWidth: '40px', textAlign: 'center' }}>1</span>
                <button style={{ padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.25rem' }}>+</button>
              </div>
              <button
                style={{
                  flex: 1,
                  padding: '16px 32px',
                  background: stock > 0 ? '#3b82f6' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: stock > 0 ? 'pointer' : 'not-allowed'
                }}
                disabled={stock === 0}
              >
                {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button style={{
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '1.25rem'
              }}>
                ♡
              </button>
            </div>

            {/* Features */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚚</span>
                  <span style={{ fontSize: '0.875rem' }}>Free shipping over $50</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>↩️</span>
                  <span style={{ fontSize: '0.875rem' }}>30-day returns</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔒</span>
                  <span style={{ fontSize: '0.875rem' }}>Secure checkout</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💬</span>
                  <span style={{ fontSize: '0.875rem' }}>24/7 support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '32px' }}>
            Customer Reviews ({rating.count})
          </h2>

          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {reviews.map(review => (
                <div key={review.id} style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: '#fbbf24' }}>
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                      {review.title && (
                        <h4 style={{ fontWeight: 600, margin: '8px 0 0' }}>{review.title}</h4>
                      )}
                    </div>
                    {review.verifiedPurchase && (
                      <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>✓ Verified Purchase</span>
                    )}
                  </div>
                  <p style={{ color: '#64748b', lineHeight: 1.6, margin: '0 0 12px' }}>{review.content}</p>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {review.helpfulCount > 0 && `${review.helpfulCount} people found this helpful`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b' }}>No reviews yet. Be the first to review this product!</p>
          )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '32px' }}>
              Related Products
            </h2>
            <ProductGrid products={related} columns={4} />
          </section>
        )}
      </div>

      <Footer />
    </>
  );
};

export default ProductDetail;
