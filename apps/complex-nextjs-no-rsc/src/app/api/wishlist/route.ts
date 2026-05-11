import { NextResponse } from 'next/server';
import { getProductById } from '@/lib/data';

export async function POST(request: Request) {
  const { productId, action } = await request.json();

  const product = await getProductById(productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // In real app: toggle wishlist status in database
  // For benchmark: simulate successful toggle
  const added = action === 'add';

  return NextResponse.json({
    success: true,
    productId,
    inWishlist: added,
  });
}
