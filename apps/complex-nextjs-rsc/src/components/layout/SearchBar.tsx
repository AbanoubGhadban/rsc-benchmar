'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <input
        type="search"
        className="search-input"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}
