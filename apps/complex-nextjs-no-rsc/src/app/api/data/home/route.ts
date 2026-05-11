import { NextResponse } from 'next/server';
import { getFeaturedProducts, getNewArrivals, getBestSellers, getCategoryHierarchy } from '@/lib/data';

export async function GET() {
  const [featured, newArrivals, bestSellers, categories] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(8),
    getBestSellers(8),
    getCategoryHierarchy(),
  ]);

  return NextResponse.json({
    featured,
    newArrivals,
    bestSellers,
    categories,
  });
}
