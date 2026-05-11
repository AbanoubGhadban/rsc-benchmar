import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getCategories, getBrands } from '@/lib/data';
import type { ProductFilter, ProductSort } from '@shared/types';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const page = parseInt(sp.get('page') || '1', 10);
  const filter: ProductFilter = {
    categories: sp.get('category') ? [sp.get('category')!] : undefined,
    brands: sp.getAll('brand').length > 0 ? sp.getAll('brand') : undefined,
    priceMin: sp.get('priceMin') ? parseFloat(sp.get('priceMin')!) : undefined,
    priceMax: sp.get('priceMax') ? parseFloat(sp.get('priceMax')!) : undefined,
    inStock: sp.get('inStock') === '1',
  };

  const sort: ProductSort = {
    field: (sp.get('sort') as ProductSort['field']) || 'createdAt',
    direction: (sp.get('dir') as ProductSort['direction']) || 'desc',
  };

  const searchQuery = sp.get('q') || undefined;

  const [result, categories, brands] = await Promise.all([
    getProducts(filter, sort, page, 12, searchQuery),
    getCategories(),
    getBrands(),
  ]);

  return NextResponse.json({ result, categories, brands });
}
