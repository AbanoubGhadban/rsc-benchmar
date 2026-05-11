// Server Component - Waku landing page
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Pricing } from '../components/Pricing';
import { Testimonials } from '../components/Testimonials';
import { FAQ } from '../components/FAQ';
import { CTA } from '../components/CTA';
import { Contact } from '../components/Contact';
import { Footer } from '../components/Footer';

import { features, pricingPlans, testimonials, faqs } from '../lib/data';

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
