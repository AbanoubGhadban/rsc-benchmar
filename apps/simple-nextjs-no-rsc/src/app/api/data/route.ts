import { NextResponse } from 'next/server';
import { features, pricingPlans, testimonials, faqs } from '@/lib/data';

export async function GET() {
  return NextResponse.json({
    features,
    pricingPlans,
    testimonials,
    faqs,
  });
}
