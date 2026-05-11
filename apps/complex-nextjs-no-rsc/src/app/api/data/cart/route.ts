import { NextResponse } from 'next/server';
import { getCart } from '@/lib/data';

export async function GET() {
  const cart = await getCart();
  return NextResponse.json(cart);
}
