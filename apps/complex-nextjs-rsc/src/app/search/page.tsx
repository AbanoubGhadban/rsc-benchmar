// Server Component - Search results page
import { getProducts, getCategories, getBrands } from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import type { ProductFilter, ProductSort } from '@shared/types';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    brand?: string | string[];
    priceMin?: string;
    priceMax?: string;
    inStock?: string;
    sort?: string;
    dir?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const query = sp.q || '';
  const page = parseInt(sp.page || '1', 10);

  const filter: ProductFilter = {
    categories: sp.category ? [sp.category] : undefined,
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
    getProducts(filter, sort, page, 12, query),
    getCategories(),
    getBrands(),
  ]);

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Search' }]} />

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
          {query ? `Search results for "${query}"` : 'All Products'}
        </h1>
        <p style={{ color: 'var(--color-text-light)' }}>
          {result.total} {result.total === 1 ? 'result' : 'results'} found
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', paddingBottom: '48px' }}>
        <ProductFilters
          categories={categories}
          brands={brands}
          selectedCategory={sp.category}
          selectedBrands={filter.brands}
          priceMin={filter.priceMin}
          priceMax={filter.priceMax}
          inStock={filter.inStock}
        />

        <div style={{ flex: 1 }}>
          {result.items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h2 className="empty-state-title">No products found</h2>
              <p className="empty-state-description">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <>
              <ProductGrid products={result.items} />

              {result.totalPages > 1 && (
                <Pagination currentPage={result.page} totalPages={result.totalPages} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
