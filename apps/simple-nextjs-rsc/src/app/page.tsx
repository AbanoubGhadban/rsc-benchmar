// Server Component - main page composed of Server Components
// Only ContactForm is a Client Component (leaf node with state)

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

import { features, pricingPlans, testimonials, faqs } from '@/lib/data';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features features={features} />
        <Pricing plans={pricingPlans} />
        <Testimonials testimonials={testimonials} />
        <FAQ faqs={faqs} />
        <CTA />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
