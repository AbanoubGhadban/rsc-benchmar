'use client';

import { useState } from 'react';
import type { ProductVariant } from '@shared/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  options: Record<string, string[]>;
}

export function VariantSelector({ variants, options }: VariantSelectorProps) {
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (variants.length > 0) {
      variants[0].options.forEach(opt => {
        initial[opt.name] = opt.value;
      });
    }
    return initial;
  });

  const handleSelect = (optionName: string, value: string) => {
    setSelected(prev => ({ ...prev, [optionName]: value }));
  };

  if (Object.keys(options).length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Object.entries(options).map(([optionName, values]) => (
        <div key={optionName} className="variant-selector">
          <label className="variant-label">{optionName}</label>
          <div className="variant-options">
            {values.map(value => (
              <button
                key={value}
                className={`variant-option ${selected[optionName] === value ? 'selected' : ''}`}
                onClick={() => handleSelect(optionName, value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
