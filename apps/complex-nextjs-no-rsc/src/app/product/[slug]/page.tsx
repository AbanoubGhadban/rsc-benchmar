'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ProductDetail } from '@/components/product/ProductDetail';
import { ProductReviews } from '@/components/product/ProductReviews';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import type { Product, ProductVariant, Review, Category, Brand } from '@shared/types';

interface ProductData {
  product: Product;
  variants: (ProductVariant & { stock: number })[];
  reviews: Review[];
  related: Product[];
  rating: { average: number; count: number };
  category?: Category;
  brand?: Brand | null;
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/data/product/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '48px 0', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    notFound();
  }

  const { product, variants, reviews, related, rating } = data;

  return (
    <div className="container">
      <Breadcrumb
        items={[{ label: 'Products', href: '/products' }, { label: product.name }]}
      />

      <ProductDetail
        product={product}
        variants={variants}
        category={data.category || { id: '', name: 'Products', slug: 'products', parentId: null, description: null, imageUrl: null, position: 0, createdAt: new Date(), updatedAt: new Date() }}
        brand={data.brand || null}
        avgRating={rating.average}
        reviewCount={rating.count}
      />

      <ProductReviews
        reviews={reviews}
        productId={product.id}
        avgRating={rating.average}
        reviewCount={rating.count}
      />

      <RelatedProducts products={related} />
    </div>
  );
}
