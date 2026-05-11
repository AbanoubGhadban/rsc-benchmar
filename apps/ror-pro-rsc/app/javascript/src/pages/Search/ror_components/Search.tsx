// Search - React Server Component
// Search results page

import { searchProducts, getCategoryHierarchy } from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface SearchProps {
  query?: string;
}

const Search = async ({ query = '' }: SearchProps) => {
  const [results, categories] = await Promise.all([
    query ? searchProducts(query, 24) : Promise.resolve([]),
    getCategoryHierarchy(),
  ]);

  return (
    <>
      <Header categories={categories} cartItemCount={0} />

      <div className="container" style={{ padding: '32px 0' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#1e293b' }}>Search</span>
        </nav>

        {/* Search Form */}
        <div style={{ marginBottom: '32px' }}>
          <form method="get" action="/search" style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search products..."
              style={{
                flex: 1,
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1.125rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '16px 32px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {query ? (
          <>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>
              Search Results for "{query}"
            </h1>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>
              {results.length} {results.length === 1 ? 'product' : 'products'} found
            </p>

            {results.length > 0 ? (
              <ProductGrid products={results} columns={4} />
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <span style={{ fontSize: '4rem' }}>🔍</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '24px 0 8px' }}>No results found</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                  Try searching with different keywords or browse our categories.
                </p>
                <a
                  href="/products"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Browse All Products
                </a>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <span style={{ fontSize: '4rem' }}>🔍</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '24px 0 8px' }}>Search our store</h2>
            <p style={{ color: '#64748b' }}>
              Enter a search term above to find products.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default Search;
