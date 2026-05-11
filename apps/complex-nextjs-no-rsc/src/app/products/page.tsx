'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import type { Product, Category, Brand, PaginatedResult } from '@shared/types';

interface ProductsData {
  result: PaginatedResult<Product & { avgRating: number; reviewCount: number }>;
  categories: Category[];
  brands: Brand[];
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const category = searchParams.get('category');
  const brands = searchParams.getAll('brand');
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  const inStock = searchParams.get('inStock');
  const sort = searchParams.get('sort');
  const dir = searchParams.get('dir');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (category) params.set('category', category);
    brands.forEach(b => params.append('brand', b));
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    if (inStock) params.set('inStock', inStock);
    if (sort) params.set('sort', sort);
    if (dir) params.set('dir', dir);

    fetch(`/api/data/products?${params}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, category, brands.join(','), priceMin, priceMax, inStock, sort, dir]);

  if (loading && !data) {
    return (
      <div className="container" style={{ padding: '48px 0', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Products' }]} />

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>All Products</h1>

      <div style={{ display: 'flex', gap: '32px', paddingBottom: '48px', opacity: loading ? 0.5 : 1 }}>
        <ProductFilters
          categories={data.categories}
          brands={data.brands}
          selectedCategory={category || undefined}
          selectedBrands={brands.length > 0 ? brands : undefined}
          priceMin={priceMin ? parseFloat(priceMin) : undefined}
          priceMax={priceMax ? parseFloat(priceMax) : undefined}
          inStock={inStock === '1'}
        />

        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
            {data.result.total} products
          </p>

          <ProductGrid products={data.result.items} />

          {data.result.totalPages > 1 && (
            <Pagination currentPage={data.result.page} totalPages={data.result.totalPages} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', padding: '48px 0' }}>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
