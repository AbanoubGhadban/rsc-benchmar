import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { itemId, quantity } = await request.json();

  if (quantity < 1) {
    return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
  }

  // In real app: update cart item in database
  // For benchmark: simulate successful update
  return NextResponse.json({
    success: true,
    itemId,
    quantity,
  });
}
