// Server Component
import type { Product } from '@shared/types';
import { ProductCard } from './ProductCard';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="container">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          You May Also Like
        </h2>
        <div className="products-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
