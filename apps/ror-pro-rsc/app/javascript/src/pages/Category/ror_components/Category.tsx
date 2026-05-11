// Category - React Server Component
// Category page with subcategories and products

import { getCategoryBySlug, getProducts, getCategoryHierarchy, getCategories } from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface CategoryProps {
  slug: string;
  searchParams?: {
    page?: string;
    sort?: string;
    dir?: string;
  };
}

const Category = async ({ slug, searchParams = {} }: CategoryProps) => {
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return (
      <div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>
        <h1>Category Not Found</h1>
        <p>The category you're looking for doesn't exist.</p>
        <a href="/products" style={{ color: '#3b82f6' }}>Browse All Products</a>
      </div>
    );
  }

  const page = parseInt(searchParams.page || '1');
  const sort = {
    field: (searchParams.sort || 'createdAt') as any,
    direction: (searchParams.dir || 'desc') as any,
  };

  const [productsResult, allCategories, categoryHierarchy] = await Promise.all([
    getProducts({ categories: [category.id] }, sort, page, 12),
    getCategories(),
    getCategoryHierarchy(),
  ]);

  const subcategories = allCategories.filter(c => c.parentId === category.id);
  const parentCategory = category.parentId
    ? allCategories.find(c => c.id === category.parentId)
    : null;

  return (
    <>
      <Header categories={categoryHierarchy} cartItemCount={0} />

      <div className="container" style={{ padding: '32px 0' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          {parentCategory && (
            <>
              <a href={`/category/${parentCategory.slug}`} style={{ color: '#64748b', textDecoration: 'none' }}>
                {parentCategory.name}
              </a>
              <span style={{ margin: '0 8px' }}>/</span>
            </>
          )}
          <span style={{ color: '#1e293b' }}>{category.name}</span>
        </nav>

        {/* Category Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px' }}>{category.name}</h1>
          {category.description && (
            <p style={{ color: '#64748b', margin: 0 }}>{category.description}</p>
          )}
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Subcategories</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {subcategories.map(sub => (
                <a
                  key={sub.id}
                  href={`/category/${sub.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 24px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#1e293b',
                    transition: 'background 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📁</span>
                  <span style={{ fontWeight: 500 }}>{sub.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              Products ({productsResult.total})
            </h2>

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

          {productsResult.items.length > 0 ? (
            <>
              <ProductGrid products={productsResult.items} columns={4} />

              {/* Pagination */}
              {productsResult.totalPages > 1 && (
                <nav style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
                  {productsResult.hasPrev && (
                    <a
                      href={`/category/${slug}?page=${page - 1}`}
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
                        href={`/category/${slug}?page=${pageNum}`}
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
                      href={`/category/${slug}?page=${page + 1}`}
                      style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', textDecoration: 'none', color: '#1e293b' }}
                    >
                      Next →
                    </a>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#64748b' }}>
              <p>No products found in this category.</p>
              <a href="/products" style={{ color: '#3b82f6' }}>Browse all products</a>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Category;
