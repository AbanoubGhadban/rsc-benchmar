import { NextResponse } from 'next/server';
import { getProductById, getVariantStock } from '@/lib/data';

export async function POST(request: Request) {
  const { productId, variantId, quantity = 1 } = await request.json();

  const product = await getProductById(productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const variant = product.variants.find(v => v.id === variantId);
  if (!variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  }

  const stock = await getVariantStock(variantId);
  if (stock < quantity) {
    return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
  }

  // In real app: update cart in database/session
  // For benchmark: simulate successful add
  return NextResponse.json({
    success: true,
    item: {
      productId,
      variantId,
      quantity,
      unitPrice: variant.price,
    },
  });
}
