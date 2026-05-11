// Server Component - Category page
import { notFound } from 'next/navigation';
import { getProducts, getCategoryBySlug, getCategories, getBrands } from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import type { ProductFilter, ProductSort } from '@shared/types';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    brand?: string | string[];
    priceMin?: string;
    priceMax?: string;
    inStock?: string;
    sort?: string;
    dir?: string;
  }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const page = parseInt(sp.page || '1', 10);
  const filter: ProductFilter = {
    categories: [category.id],
    brands: sp.brand
      ? Array.isArray(sp.brand) ? sp.brand : [sp.brand]
      : undefined,
    priceMin: sp.priceMin ? parseFloat(sp.priceMin) : undefined,
    priceMax: sp.priceMax ? parseFloat(sp.priceMax) : undefined,
    inStock: sp.inStock === '1',
  };

  const sort: ProductSort = {
    field: (sp.sort as ProductSort['field']) || 'createdAt',
    direction: (sp.dir as ProductSort['direction']) || 'desc',
  };

  const [result, categories, brands] = await Promise.all([
    getProducts(filter, sort, page, 12),
    getCategories(),
    getBrands(),
  ]);

  return (
    <div className="container">
      <Breadcrumb items={[{ label: category.name }]} />

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>{category.name}</h1>
        {category.description && (
          <p style={{ color: 'var(--color-text-light)' }}>{category.description}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '32px', paddingBottom: '48px' }}>
        <ProductFilters
          categories={categories}
          brands={brands}
          selectedCategory={category.id}
          selectedBrands={filter.brands}
          priceMin={filter.priceMin}
          priceMax={filter.priceMax}
          inStock={filter.inStock}
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
