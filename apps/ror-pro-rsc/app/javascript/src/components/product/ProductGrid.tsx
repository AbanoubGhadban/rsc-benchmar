// Server Component - ProductGrid
import type { Product } from '@shared/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  columns?: number;
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  return (
    <div
      className="product-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '24px',
      }}
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
