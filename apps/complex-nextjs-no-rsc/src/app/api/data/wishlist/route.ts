import { NextResponse } from 'next/server';
import { getWishlist } from '@/lib/data';

export async function GET() {
  const wishlist = await getWishlist();
  return NextResponse.json(wishlist);
}
