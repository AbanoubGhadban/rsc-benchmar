// Server Component - no 'use client' directive

import type { PricingPlan } from '@shared/types';

interface PricingProps {
  plans: PricingPlan[];
}

export function Pricing({ plans }: PricingProps) {
  return (
    <section id="pricing" className="section pricing-section">
      <div className="container">
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-subtitle">
          Choose the plan that fits your needs. Upgrade or downgrade at any time.
        </p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <div className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}>
      <h3 className="pricing-name">{plan.name}</h3>
      <div className="pricing-price">
        ${plan.price}
        <span>/{plan.interval}</span>
      </div>
      <ul className="pricing-features">
        {plan.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <button className="btn btn-primary" style={{ width: '100%' }}>
        {plan.ctaText}
      </button>
    </div>
  );
}
