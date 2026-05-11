'use client';

import { useState } from 'react';

interface Address {
  id: string;
  label: string;
  street: string;
  apartment?: string;
  city: string;
  state: string | null;
  zip: string;
  country: string;
  isDefault?: boolean;
}

interface AddressCardProps {
  address: Address;
}

export function AddressCard({ address }: AddressCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSetDefault = async () => {
    setLoading(true);
    // In real app: API call to set default address
    setTimeout(() => setLoading(false), 500);
  };

  const handleEdit = () => {
    // In real app: open edit modal or navigate to edit page
    console.log('Edit address:', address.id);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setLoading(true);
    // In real app: API call to delete address
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div
      style={{
        padding: '20px',
        background: 'var(--color-bg)',
        border: `2px solid ${address.isDefault ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        opacity: loading ? 0.5 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ fontWeight: 600 }}>{address.label}</div>
        {address.isDefault && (
          <span
            style={{
              padding: '2px 8px',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            Default
          </span>
        )}
      </div>

      <div style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', lineHeight: 1.5 }}>
        {address.street}
        {address.apartment && `, ${address.apartment}`}
        <br />
        {address.city}{address.state ? `, ${address.state}` : ''} {address.zip}
        <br />
        {address.country}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleEdit}
          disabled={loading}
        >
          Edit
        </button>
        {!address.isDefault && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSetDefault}
            disabled={loading}
          >
            Set as Default
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleDelete}
          disabled={loading}
          style={{ color: 'var(--color-error)', marginLeft: 'auto' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
