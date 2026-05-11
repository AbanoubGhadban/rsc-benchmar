'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Category, Brand } from '@shared/types';

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  selectedCategory?: string;
  selectedBrands?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
}

export function ProductFilters({
  categories,
  brands,
  selectedCategory,
  selectedBrands = [],
  priceMin,
  priceMax,
  inStock,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback((key: string, value: string | string[] | boolean | undefined) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      params.delete(key);
    } else if (Array.isArray(value)) {
      params.delete(key);
      value.forEach(v => params.append(key, v));
    } else if (typeof value === 'boolean') {
      if (value) {
        params.set(key, '1');
      } else {
        params.delete(key);
      }
    } else {
      params.set(key, value);
    }

    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const toggleBrand = (brandId: string) => {
    const newBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter(b => b !== brandId)
      : [...selectedBrands, brandId];
    updateFilter('brand', newBrands);
  };

  const topLevelCategories = categories.filter(c => c.parentId === null);

  return (
    <aside className="filters-sidebar">
      <div className="filter-group">
        <h3 className="filter-title">Categories</h3>
        <div className="filter-options">
          {topLevelCategories.map(cat => (
            <label key={cat.id} className="filter-option">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat.id}
                onChange={() => updateFilter('category', cat.id)}
              />
              {cat.name}
            </label>
          ))}
          {selectedCategory && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => updateFilter('category', undefined)}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="filter-group">
        <h3 className="filter-title">Brands</h3>
        <div className="filter-options">
          {brands.slice(0, 10).map(brand => (
            <label key={brand.id} className="filter-option">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.id)}
                onChange={() => toggleBrand(brand.id)}
              />
              {brand.name}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h3 className="filter-title">Price Range</h3>
        <div className="price-range">
          <input
            type="number"
            className="price-input"
            placeholder="Min"
            value={priceMin || ''}
            onChange={(e) => updateFilter('priceMin', e.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            className="price-input"
            placeholder="Max"
            value={priceMax || ''}
            onChange={(e) => updateFilter('priceMax', e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group">
        <h3 className="filter-title">Availability</h3>
        <label className="filter-option">
          <input
            type="checkbox"
            checked={inStock || false}
            onChange={(e) => updateFilter('inStock', e.target.checked)}
          />
          In Stock Only
        </label>
      </div>
    </aside>
  );
}
