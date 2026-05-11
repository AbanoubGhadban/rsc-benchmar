import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/data';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get('page') || '1', 10);
  const result = await getOrders(page, 10);
  return NextResponse.json(result);
}
