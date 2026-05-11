// Server Component - Addresses page
import { getCurrentUser } from '@/lib/data';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AddressCard } from '@/components/account/AddressCard';

export default async function AddressesPage() {
  const user = await getCurrentUser();

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Account', href: '/account' }, { label: 'Addresses' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Saved Addresses</h1>
        <button className="btn btn-primary">Add New Address</button>
      </div>

      {user.addresses.length === 0 ? (
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
          {user.addresses.map(address => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
