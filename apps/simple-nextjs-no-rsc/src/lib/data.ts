// Static data for landing page
// In a real app, this would come from the database
// Using static data for fair comparison with non-RSC versions

import type { Feature, PricingPlan, Testimonial, FAQ } from '@shared/types';

export type { Feature, PricingPlan, Testimonial };
export type FAQItem = FAQ;

export const features: Feature[] = [
  { id: '1', icon: '⚡', title: 'Lightning Fast', description: 'Optimized for speed with cutting-edge technology. Experience sub-second load times on any device.' },
  { id: '2', icon: '🛡️', title: 'Secure by Default', description: 'Enterprise-grade security built into every layer. Your data is protected with industry-leading encryption.' },
  { id: '3', icon: '🌍', title: 'Global Scale', description: 'Deployed across 50+ regions worldwide. Your users get the best experience no matter where they are.' },
  { id: '4', icon: '🔧', title: 'Developer First', description: 'APIs and SDKs for every major platform. Build integrations in minutes, not days.' },
  { id: '5', icon: '👥', title: 'Team Collaboration', description: 'Built for teams of any size. Real-time collaboration features keep everyone in sync.' },
  { id: '6', icon: '📈', title: 'Analytics', description: 'Real-time insights and reporting. Understand your users and optimize for growth.' },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: '1',
    name: 'Starter',
    price: 0,
    interval: 'month',
    features: ['Up to 3 projects', '1GB storage', 'Community support', 'Basic analytics'],
    highlighted: false,
    ctaText: 'Get Started Free',
  },
  {
    id: '2',
    name: 'Pro',
    price: 29,
    interval: 'month',
    features: ['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team members'],
    highlighted: true,
    ctaText: 'Start Free Trial',
  },
  {
    id: '3',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    features: ['Everything in Pro', 'Unlimited storage', 'Dedicated support', 'SLA guarantee', 'SSO/SAML', 'Custom integrations', 'On-premise option'],
    highlighted: false,
    ctaText: 'Contact Sales',
  },
];

export const testimonials: Testimonial[] = [
  { id: '1', author: 'Sarah Chen', role: 'CTO', company: 'TechCorp', content: 'This platform has transformed how we build and deploy applications. The performance gains alone justified the switch.', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', rating: 5 },
  { id: '2', author: 'Michael Roberts', role: 'Lead Developer', company: 'StartupX', content: 'The developer experience is unmatched. We shipped our MVP in half the time we expected.', avatarUrl: 'https://i.pravatar.cc/150?u=michael', rating: 5 },
  { id: '3', author: 'Emily Watson', role: 'Engineering Manager', company: 'ScaleUp Inc', content: 'Excellent documentation and support. Our team was productive from day one.', avatarUrl: 'https://i.pravatar.cc/150?u=emily', rating: 4 },
  { id: '4', author: 'David Kim', role: 'Founder', company: 'Innovate Labs', content: 'The best investment we made this year. ROI was visible within the first month.', avatarUrl: 'https://i.pravatar.cc/150?u=david', rating: 5 },
];

export const faqs: FAQ[] = [
  { id: '1', question: 'How do I get started?', answer: 'Sign up for a free account and follow our quick start guide. You\'ll be up and running in under 5 minutes.', category: 'Getting Started' },
  { id: '2', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and wire transfers for enterprise customers.', category: 'Billing' },
  { id: '3', question: 'Can I change my plan later?', answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.', category: 'Billing' },
  { id: '4', question: 'Is there a free trial?', answer: 'Yes, all paid plans come with a 14-day free trial. No credit card required.', category: 'Getting Started' },
  { id: '5', question: 'What kind of support do you offer?', answer: 'We offer email support for all plans, priority support for Pro plans, and dedicated support for Enterprise customers.', category: 'Support' },
  { id: '6', question: 'Do you offer refunds?', answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans.', category: 'Billing' },
];
