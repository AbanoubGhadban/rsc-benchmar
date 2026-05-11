// Server Component - wraps the client form

import { ContactForm } from './ContactForm';

export function Contact() {
  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        <h2 className="section-title">Get in Touch</h2>
        <p className="section-subtitle">
          Have questions? We'd love to hear from you.
        </p>
        <ContactForm />
      </div>
    </section>
  );
}
