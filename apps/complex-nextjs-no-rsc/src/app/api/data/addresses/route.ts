import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/data';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ addresses: user.addresses });
}
