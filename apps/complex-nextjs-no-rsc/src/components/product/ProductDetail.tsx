// Server Component - wraps client interactive parts
import type { Product, ProductVariant, Category, Brand, Review } from '@shared/types';
import { getVariantStock } from '@/lib/data';
import { formatPrice } from '@/lib/format';
import { VariantSelector } from './VariantSelector';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';
import { ProductGallery } from './ProductGallery';

interface ProductDetailProps {
  product: Product;
  variants: ProductVariant[];
  category: Category;
  brand: Brand | null;
  avgRating: number;
  reviewCount: number;
}

export async function ProductDetail({
  product,
  variants,
  category,
  brand,
  avgRating,
  reviewCount,
}: ProductDetailProps) {
  const defaultVariant = variants[0];
  const stock = await getVariantStock(defaultVariant?.id || '');

  const images = [
    product.featuredImageUrl,
    ...variants.map(v => v.imageUrl).filter(Boolean),
  ].filter((url): url is string => Boolean(url)).slice(0, 5);

  const uniqueOptions = new Map<string, Set<string>>();
  variants.forEach(v => {
    v.options.forEach(opt => {
      if (!uniqueOptions.has(opt.name)) {
        uniqueOptions.set(opt.name, new Set());
      }
      uniqueOptions.get(opt.name)!.add(opt.value);
    });
  });

  return (
    <div className="product-detail">
      <div className="product-gallery">
        <ProductGallery images={images} productName={product.name} />
      </div>

      <div className="product-meta">
        {brand && <div className="product-brand">{brand.name}</div>}
        <h1 className="product-title">{product.name}</h1>
        <p className="product-sku">SKU: {product.sku}</p>

        <div className="product-rating">
          <span className="rating-stars">
            {'★'.repeat(Math.round(avgRating))}
            {'☆'.repeat(5 - Math.round(avgRating))}
          </span>
          <span className="rating-count">
            {avgRating.toFixed(1)} ({reviewCount} reviews)
          </span>
        </div>

        <div className="product-price">
          <span className="price-current" style={{ fontSize: '2rem' }}>
            {formatPrice(defaultVariant?.price || product.basePrice)}
          </span>
          {product.compareAtPrice && (
            <span className="price-compare" style={{ fontSize: '1.25rem' }}>
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        <p className="product-description">{product.description}</p>

        <VariantSelector
          variants={variants}
          options={Object.fromEntries(
            Array.from(uniqueOptions.entries()).map(([k, v]) => [k, Array.from(v)])
          )}
        />

        <div
          className={`stock-status ${
            stock > 10 ? 'in-stock' : stock > 0 ? 'low-stock' : 'out-of-stock'
          }`}
        >
          {stock > 10 && '✓ In Stock'}
          {stock > 0 && stock <= 10 && `⚠ Only ${stock} left`}
          {stock === 0 && '✗ Out of Stock'}
        </div>

        <div className="add-to-cart-section">
          <AddToCartButton
            variantId={defaultVariant?.id || ''}
            disabled={stock === 0}
          />
          <WishlistButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
