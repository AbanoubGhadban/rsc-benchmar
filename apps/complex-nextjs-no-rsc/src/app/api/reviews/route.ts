import { NextResponse } from 'next/server';
import { getProductById } from '@/lib/data';

export async function POST(request: Request) {
  const { productId, rating, title, content } = await request.json();

  if (!productId || !rating || !title || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // In real app: create review in database
  // For benchmark: simulate successful creation
  const review = {
    id: `review-${Date.now()}`,
    productId,
    userId: 'current-user',
    rating,
    title,
    content,
    createdAt: new Date().toISOString(),
    helpful: 0,
    verified: false,
  };

  return NextResponse.json({
    success: true,
    review,
  });
}
