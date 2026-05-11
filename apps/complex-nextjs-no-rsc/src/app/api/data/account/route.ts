import { NextResponse } from 'next/server';
import { getCurrentUser, getOrders } from '@/lib/data';

export async function GET() {
  const [user, ordersResult] = await Promise.all([
    getCurrentUser(),
    getOrders(1, 3),
  ]);

  return NextResponse.json({ user, ordersResult });
}
