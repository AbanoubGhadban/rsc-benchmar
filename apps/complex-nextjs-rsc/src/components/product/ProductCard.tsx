// Server Component
import Link from 'next/link';
import type { Product } from '@shared/types';
import { formatPrice, getProductRating } from '@/lib/data';

interface ProductCardProps {
  product: Product;
  showRating?: boolean;
}

export function ProductCard({ product, showRating = true }: ProductCardProps) {
  const rating = getProductRating(product.id);
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const discount = isOnSale
    ? Math.round((1 - product.basePrice / product.compareAtPrice!) * 100)
    : 0;

  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`}>
        <div className="product-image">
          {product.featuredImageUrl && (
            <img src={product.featuredImageUrl} alt={product.name} loading="lazy" />
          )}
          {isOnSale && <span className="product-badge sale">-{discount}%</span>}
          {product.tags.includes('new') && !isOnSale && (
            <span className="product-badge">New</span>
          )}
        </div>
        <div className="product-info">
          <div className="product-brand">{product.tags[0] || 'Brand'}</div>
          <h3 className="product-name">{product.name}</h3>
          <div className="product-price">
            <span className="price-current">{formatPrice(product.basePrice)}</span>
            {isOnSale && (
              <span className="price-compare">{formatPrice(product.compareAtPrice!)}</span>
            )}
          </div>
          {showRating && rating.count > 0 && (
            <div className="product-rating">
              <span className="rating-stars">
                {'★'.repeat(Math.round(rating.average))}
                {'☆'.repeat(5 - Math.round(rating.average))}
              </span>
              <span className="rating-count">({rating.count})</span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
