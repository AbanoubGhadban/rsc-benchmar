'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
}

export function CheckoutForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [form, setForm] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'shipping') {
      setStep('payment');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const { orderId } = await res.json();
        router.push(`/account/orders/${orderId}?success=true`);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {step === 'shipping' && (
        <>
          <section className="checkout-section">
            <h2 className="checkout-section-title">Contact Information</h2>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Shipping Address</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group full">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group full">
                <label className="form-label">Apartment, suite, etc. (optional)</label>
                <input
                  type="text"
                  name="apartment"
                  className="form-input"
                  value={form.apartment}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="state"
                  className="form-input"
                  value={form.state}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP Code</label>
                <input
                  type="text"
                  name="zip"
                  className="form-input"
                  value={form.zip}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <select
                  name="country"
                  className="form-select"
                  value={form.country}
                  onChange={handleChange}
                  required
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
              </div>
            </div>
          </section>

          <button type="submit" className="btn btn-primary btn-lg">
            Continue to Payment
          </button>
        </>
      )}

      {step === 'payment' && (
        <>
          <section className="checkout-section">
            <h2 className="checkout-section-title">Payment Details</h2>
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input
                type="text"
                name="cardNumber"
                className="form-input"
                placeholder="1234 5678 9012 3456"
                value={form.cardNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input
                  type="text"
                  name="cardExpiry"
                  className="form-input"
                  placeholder="MM/YY"
                  value={form.cardExpiry}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">CVC</label>
                <input
                  type="text"
                  name="cardCvc"
                  className="form-input"
                  placeholder="123"
                  value={form.cardCvc}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Name on Card</label>
              <input
                type="text"
                name="cardName"
                className="form-input"
                value={form.cardName}
                onChange={handleChange}
                required
              />
            </div>
          </section>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => setStep('shipping')}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
