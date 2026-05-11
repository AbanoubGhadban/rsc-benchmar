'use client';

import { useState, useEffect } from 'react';
import {
  Header,
  Hero,
  Features,
  Pricing,
  Testimonials,
  FAQ,
  CTA,
  Contact,
  Footer,
} from '@/components';

import type { Feature, PricingPlan, Testimonial, FAQItem } from '@/lib/data';

interface PageData {
  features: Feature[];
  pricingPlans: PricingPlan[];
  testimonials: Testimonial[];
  faqs: FAQItem[];
}

export default function HomePage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features features={data.features} />
        <Pricing plans={data.pricingPlans} />
        <Testimonials testimonials={data.testimonials} />
        <FAQ faqs={data.faqs} />
        <CTA />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
