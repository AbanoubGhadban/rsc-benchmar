'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { formatPrice } from '@/lib/format';
import type { Product, Category } from '@shared/types';

interface HomeData {
  featured: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  categories: (Category & { children: Category[] })[];
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/home')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '48px 0', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Shop the Latest Collection</h1>
          <p className="hero-subtitle">
            Discover our curated selection of premium products designed for modern living.
          </p>
          <Link href="/products" className="btn btn-primary btn-lg">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="container" style={{ padding: '48px 0' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>
          Shop by Category
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {data.categories.slice(0, 6).map(category => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              style={{
                padding: '24px',
                background: 'var(--color-bg-alt)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontWeight: 500 }}>{category.name}</div>
              {category.children.length > 0 && (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                  {category.children.length} subcategories
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingBottom: '48px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>
          Featured Products
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '24px',
          }}
        >
          {data.featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingBottom: '48px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>
          New Arrivals
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '24px',
          }}
        >
          {data.newArrivals.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingBottom: '48px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Best Sellers</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '24px',
          }}
        >
          {data.bestSellers.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
