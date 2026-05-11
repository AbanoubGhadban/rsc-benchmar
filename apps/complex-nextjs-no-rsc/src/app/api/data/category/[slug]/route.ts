import { NextRequest, NextResponse } from 'next/server';
import { getCategoryBySlug, getProducts, getCategories, getBrands } from '@/lib/data';
import type { ProductFilter, ProductSort } from '@shared/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sp = request.nextUrl.searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const page = parseInt(sp.get('page') || '1', 10);
  const filter: ProductFilter = {
    categories: [category.id],
    brands: sp.getAll('brand').length > 0 ? sp.getAll('brand') : undefined,
    priceMin: sp.get('priceMin') ? parseFloat(sp.get('priceMin')!) : undefined,
    priceMax: sp.get('priceMax') ? parseFloat(sp.get('priceMax')!) : undefined,
    inStock: sp.get('inStock') === '1',
  };

  const sort: ProductSort = {
    field: (sp.get('sort') as ProductSort['field']) || 'createdAt',
    direction: (sp.get('dir') as ProductSort['direction']) || 'desc',
  };

  const [result, categories, brands] = await Promise.all([
    getProducts(filter, sort, page, 12),
    getCategories(),
    getBrands(),
  ]);

  return NextResponse.json({ category, result, categories, brands });
}
