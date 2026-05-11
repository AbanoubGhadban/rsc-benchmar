import { NextRequest, NextResponse } from 'next/server';
import {
  getProductBySlug,
  getProductVariants,
  getProductReviews,
  getRelatedProducts,
  getProductRating,
  getVariantStock,
  getCategories,
  getBrands,
} from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const [variants, reviews, related, categories, brands] = await Promise.all([
    getProductVariants(product.id),
    getProductReviews(product.id, 10),
    getRelatedProducts(product.id, product.categoryId, 4),
    getCategories(),
    getBrands(),
  ]);

  const rating = getProductRating(product.id);
  const category = categories.find(c => c.id === product.categoryId);
  const brand = brands.find(b => b.id === product.brandId) || null;

  const variantsWithStock = await Promise.all(
    variants.map(async v => ({
      ...v,
      stock: await getVariantStock(v.id),
    }))
  );

  return NextResponse.json({
    product,
    variants: variantsWithStock,
    reviews,
    related,
    rating,
    category,
    brand,
  });
}
