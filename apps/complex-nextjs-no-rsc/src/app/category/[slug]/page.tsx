'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, notFound } from 'next/navigation';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import type { Product, Category, Brand, PaginatedResult } from '@shared/types';

interface CategoryData {
  category: Category;
  result: PaginatedResult<Product & { avgRating: number; reviewCount: number }>;
  categories: Category[];
  brands: Brand[];
}

function CategoryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const brands = searchParams.getAll('brand');
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  const inStock = searchParams.get('inStock');
  const sort = searchParams.get('sort');
  const dir = searchParams.get('dir');

  useEffect(() => {
    setLoading(true);
    const apiParams = new URLSearchParams();
    apiParams.set('page', page.toString());
    brands.forEach(b => apiParams.append('brand', b));
    if (priceMin) apiParams.set('priceMin', priceMin);
    if (priceMax) apiParams.set('priceMax', priceMax);
    if (inStock) apiParams.set('inStock', inStock);
    if (sort) apiParams.set('sort', sort);
    if (dir) apiParams.set('dir', dir);

    fetch(`/api/data/category/${slug}?${apiParams}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug, page, brands.join(','), priceMin, priceMax, inStock, sort, dir]);

  if (loading && !data) {
    return (
      <div className="container" style={{ padding: '48px 0', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    notFound();
  }

  const { category, result, categories, allBrands } = data as CategoryData & { allBrands?: Brand[] };

  return (
    <div className="container">
      <Breadcrumb items={[{ label: category.name }]} />

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>{category.name}</h1>
        {category.description && (
          <p style={{ color: 'var(--color-text-light)' }}>{category.description}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '32px', paddingBottom: '48px', opacity: loading ? 0.5 : 1 }}>
        <ProductFilters
          categories={categories}
          brands={data.brands}
          selectedCategory={category.id}
          selectedBrands={brands.length > 0 ? brands : undefined}
          priceMin={priceMin ? parseFloat(priceMin) : undefined}
          priceMax={priceMax ? parseFloat(priceMax) : undefined}
          inStock={inStock === '1'}
        />

        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
            {result.total} products
          </p>

          <ProductGrid products={result.items} />

          {result.totalPages > 1 && (
            <Pagination currentPage={result.page} totalPages={result.totalPages} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', padding: '48px 0' }}>Loading...</div>}>
      <CategoryContent />
    </Suspense>
  );
}
