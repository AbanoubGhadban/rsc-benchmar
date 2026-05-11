'use client';

import { useState } from 'react';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });

    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="name">Name</label>
        <input
          className="form-input"
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="email">Email</label>
        <input
          className="form-input"
          type="email"
          id="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="subject">Subject</label>
        <input
          className="form-input"
          type="text"
          id="subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="message">Message</label>
        <textarea
          className="form-textarea"
          id="message"
          name="message"
          value={form.message}
          onChange={handleChange}
          required
        />
      </div>
      <button
        className="btn btn-primary"
        type="submit"
        disabled={status === 'submitting'}
        style={{ width: '100%' }}
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
      {status === 'success' && (
        <p style={{ color: '#22c55e', textAlign: 'center', marginTop: '16px' }}>
          Message sent successfully!
        </p>
      )}
    </form>
  );
}
