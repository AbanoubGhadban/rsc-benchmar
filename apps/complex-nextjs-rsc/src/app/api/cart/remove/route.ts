import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { itemId } = await request.json();

  // In real app: remove cart item from database
  // For benchmark: simulate successful removal
  return NextResponse.json({
    success: true,
    itemId,
  });
}
