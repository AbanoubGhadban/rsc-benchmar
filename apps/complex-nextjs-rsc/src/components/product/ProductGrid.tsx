// Server Component
import type { Product } from '@shared/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  showRating?: boolean;
}

export function ProductGrid({ products, showRating = true }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <h3 className="empty-state-title">No products found</h3>
        <p className="empty-state-description">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} showRating={showRating} />
      ))}
    </div>
  );
}
