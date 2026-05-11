// Server Component - no 'use client' directive

import type { FAQ as FAQType } from '@shared/types';

interface FAQProps {
  faqs: FAQType[];
}

export function FAQ({ faqs }: FAQProps) {
  return (
    <section id="faq" className="section">
      <div className="container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">
          Got questions? We've got answers.
        </p>
        <div className="faq-list">
          {faqs.map((faq) => (
            <FAQItem key={faq.id} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq }: { faq: FAQType }) {
  return (
    <div className="faq-item">
      <h3 className="faq-question">{faq.question}</h3>
      <p className="faq-answer">{faq.answer}</p>
    </div>
  );
}
