'use client';

import { useState, useEffect } from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AddressCard } from '@/components/account/AddressCard';

interface Address {
  id: string;
  label: string;
  street: string;
  apartment: string;
  city: string;
  state: string | null;
  zip: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/addresses')
      .then(res => res.json())
      .then(data => setAddresses(data.addresses))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 0' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Account', href: '/account' }, { label: 'Addresses' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Saved Addresses</h1>
        <button className="btn btn-primary">Add New Address</button>
      </div>

      {addresses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📍</div>
          <h2 className="empty-state-title">No addresses saved</h2>
          <p className="empty-state-description">
            Add a shipping address for faster checkout.
          </p>
          <button className="btn btn-primary">Add Address</button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {addresses.map(address => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
