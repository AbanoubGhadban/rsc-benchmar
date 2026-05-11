// Server Component - no 'use client' directive

import type { Testimonial } from '@shared/types';

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <section id="testimonials" className="section">
      <div className="container">
        <h2 className="section-title">Loved by Developers</h2>
        <p className="section-subtitle">
          See what our customers have to say about their experience
        </p>
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-rating">
        {'★'.repeat(testimonial.rating)}
        {'☆'.repeat(5 - testimonial.rating)}
      </div>
      <p className="testimonial-content">"{testimonial.content}"</p>
      <div className="testimonial-author">
        {testimonial.avatarUrl && (
          <img
            src={testimonial.avatarUrl}
            alt={testimonial.author}
            className="testimonial-avatar"
            width={48}
            height={48}
          />
        )}
        <div>
          <div className="testimonial-name">{testimonial.author}</div>
          <div className="testimonial-role">
            {testimonial.role} at {testimonial.company}
          </div>
        </div>
      </div>
    </div>
  );
}
