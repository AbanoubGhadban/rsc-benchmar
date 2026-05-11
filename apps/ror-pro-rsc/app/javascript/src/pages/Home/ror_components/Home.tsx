// Home - React Server Component
// Async data fetching for categories, featured products, new arrivals, best sellers

import { getCategoryHierarchy, getFeaturedProducts, getNewArrivals, getBestSellers } from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Home = async () => {
  const [categories, featured, newArrivals, bestSellers] = await Promise.all([
    getCategoryHierarchy(),
    getFeaturedProducts(8),
    getNewArrivals(8),
    getBestSellers(8),
  ]);

  const cartItemCount = 0; // Demo cart is empty initially

  return (
    <>
      <Header categories={categories} cartItemCount={cartItemCount} />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        color: 'white',
        padding: '80px 0',
        textAlign: 'center',
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px' }}>
            Shop the Latest Tech
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Premium electronics and accessories with fast shipping and excellent support.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a href="/products" className="btn btn-primary" style={{ background: 'white', color: '#1e40af', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Shop Now
            </a>
            <a href="/category/electronics" className="btn btn-secondary" style={{ border: '2px solid white', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Browse Categories
            </a>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '32px', textAlign: 'center' }}>
            Shop by Category
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
          }}>
            {categories.slice(0, 5).map(cat => (
              <a
                key={cat.id}
                href={`/category/${cat.slug}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px 24px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                  {cat.name === 'Electronics' && '💻'}
                  {cat.name === 'Office' && '🏢'}
                  {cat.name === 'Accessories' && '🎧'}
                  {cat.name === 'Audio' && '🔊'}
                  {cat.name === 'Storage' && '💾'}
                </div>
                <h3 style={{ fontWeight: 600, margin: 0 }}>{cat.name}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '8px 0 0' }}>
                  {cat.children?.length || 0} subcategories
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '64px 0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Featured Products</h2>
            <a href="/products?featured=1" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>View All →</a>
          </div>
          <ProductGrid products={featured} />
        </div>
      </section>

      {/* New Arrivals */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>New Arrivals</h2>
            <a href="/products?sort=createdAt&dir=desc" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>View All →</a>
          </div>
          <ProductGrid products={newArrivals} />
        </div>
      </section>

      {/* Best Sellers */}
      <section style={{ padding: '64px 0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Best Sellers</h2>
            <a href="/products?bestseller=1" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>View All →</a>
          </div>
          <ProductGrid products={bestSellers} />
        </div>
      </section>

      {/* Promo Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '64px 0',
        textAlign: 'center',
      }}>
        <div className="container">
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>
            Free Shipping on Orders Over $50
          </h2>
          <p style={{ opacity: 0.9, marginBottom: '24px' }}>
            Plus easy returns and a 30-day money-back guarantee
          </p>
          <a href="/products" style={{ background: '#3b82f6', color: 'white', padding: '14px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
            Start Shopping
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
