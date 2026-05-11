// Products - React Server Component
// Product listing with filters and pagination

import { getProducts, getCategories, getBrands, getCategoryHierarchy, formatPrice } from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface ProductsProps {
  searchParams?: {
    page?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    dir?: string;
  };
}

const Products = async ({ searchParams = {} }: ProductsProps) => {
  const page = parseInt(searchParams.page || '1');
  const filter: any = {};

  if (searchParams.category) filter.categories = [searchParams.category];
  if (searchParams.brand) filter.brands = [searchParams.brand];
  if (searchParams.minPrice) filter.priceMin = parseFloat(searchParams.minPrice);
  if (searchParams.maxPrice) filter.priceMax = parseFloat(searchParams.maxPrice);

  const sort = {
    field: (searchParams.sort || 'createdAt') as any,
    direction: (searchParams.dir || 'desc') as any,
  };

  const [productsResult, categories, brands, categoryHierarchy] = await Promise.all([
    getProducts(filter, sort, page, 12),
    getCategories(),
    getBrands(),
    getCategoryHierarchy(),
  ]);

  const cartItemCount = 0;

  return (
    <>
      <Header categories={categoryHierarchy} cartItemCount={cartItemCount} />

      <div className="container" style={{ padding: '32px 0' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#1e293b' }}>Products</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
          {/* Filters Sidebar */}
          <aside style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '24px', fontSize: '1.125rem' }}>Filters</h3>

            {/* Categories */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.875rem', color: '#64748b' }}>Category</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {categories.filter(c => c.parentId === null).map(cat => (
                  <li key={cat.id} style={{ marginBottom: '8px' }}>
                    <a
                      href={`/products?category=${cat.id}`}
                      style={{
                        color: filter.categories?.includes(cat.id) ? '#3b82f6' : '#1e293b',
                        textDecoration: 'none',
                        fontSize: '0.875rem'
                      }}
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brands */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.875rem', color: '#64748b' }}>Brand</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {brands.slice(0, 8).map(brand => (
                  <li key={brand.id} style={{ marginBottom: '8px' }}>
                    <a
                      href={`/products?brand=${brand.id}`}
                      style={{
                        color: filter.brands?.includes(brand.id) ? '#3b82f6' : '#1e293b',
                        textDecoration: 'none',
                        fontSize: '0.875rem'
                      }}
                    >
                      {brand.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Range */}
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.875rem', color: '#64748b' }}>Price</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="/products?maxPrice=50" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem' }}>Under $50</a>
                <a href="/products?minPrice=50&maxPrice=100" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem' }}>$50 - $100</a>
                <a href="/products?minPrice=100&maxPrice=200" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem' }}>$100 - $200</a>
                <a href="/products?minPrice=200" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '0.875rem' }}>Over $200</a>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                All Products
                <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b', marginLeft: '12px' }}>
                  ({productsResult.total} items)
                </span>
              </h1>

              {/* Sort dropdown */}
              <form method="get" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b' }}>Sort by:</label>
                <select
                  name="sort"
                  defaultValue={searchParams.sort || 'createdAt'}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                >
                  <option value="createdAt">Newest</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
                <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Apply
                </button>
              </form>
            </div>

            <ProductGrid products={productsResult.items} columns={3} />

            {/* Pagination */}
            {productsResult.totalPages > 1 && (
              <nav style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
                {productsResult.hasPrev && (
                  <a
                    href={`/products?page=${page - 1}`}
                    style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', textDecoration: 'none', color: '#1e293b' }}
                  >
                    ← Prev
                  </a>
                )}

                {Array.from({ length: Math.min(5, productsResult.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <a
                      key={pageNum}
                      href={`/products?page=${pageNum}`}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: pageNum === page ? 'white' : '#1e293b',
                        background: pageNum === page ? '#3b82f6' : 'transparent',
                      }}
                    >
                      {pageNum}
                    </a>
                  );
                })}

                {productsResult.hasNext && (
                  <a
                    href={`/products?page=${page + 1}`}
                    style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', textDecoration: 'none', color: '#1e293b' }}
                  >
                    Next →
                  </a>
                )}
              </nav>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Products;
