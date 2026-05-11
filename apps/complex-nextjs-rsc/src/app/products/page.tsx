// Server Component - Products listing page
import { getProducts, getCategories, getBrands } from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import type { ProductFilter, ProductSort } from '@shared/types';

interface ProductsPageProps {
  searchParams: Promise<{
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const page = parseInt(params.page || '1', 10);
  const filter: ProductFilter = {
    categories: params.category ? [params.category] : undefined,
    brands: params.brand
      ? Array.isArray(params.brand) ? params.brand : [params.brand]
      : undefined,
    priceMin: params.priceMin ? parseFloat(params.priceMin) : undefined,
    priceMax: params.priceMax ? parseFloat(params.priceMax) : undefined,
    inStock: params.inStock === '1',
  };

  const sort: ProductSort = {
    field: (params.sort as ProductSort['field']) || 'createdAt',
    direction: (params.dir as ProductSort['direction']) || 'desc',
  };

  const [result, categories, brands] = await Promise.all([
    getProducts(filter, sort, page, 12),
    getCategories(),
    getBrands(),
  ]);

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Products' }]} />

      <div style={{ display: 'flex', gap: '32px', paddingBottom: '48px' }}>
        <ProductFilters
          categories={categories}
          brands={brands}
          selectedCategory={params.category}
          selectedBrands={filter.brands}
          priceMin={filter.priceMin}
          priceMax={filter.priceMax}
          inStock={filter.inStock}
        />

        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <p style={{ color: 'var(--color-text-light)' }}>
              {result.total} products found
            </p>
            <SortSelector currentSort={sort} />
          </div>

          <ProductGrid products={result.items} />

          {result.totalPages > 1 && (
            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SortSelector({ currentSort }: { currentSort: ProductSort }) {
  return (
    <form>
      <select
        name="sort"
        className="form-select"
        defaultValue={`${currentSort.field}-${currentSort.direction}`}
        style={{ width: 'auto' }}
      >
        <option value="createdAt-desc">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name-asc">Name: A-Z</option>
        <option value="name-desc">Name: Z-A</option>
      </select>
    </form>
  );
}
