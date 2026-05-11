'use client';

import { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="gallery-main" style={{ background: '#f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '4rem' }}>
          📷
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="gallery-main">
        <img src={images[selectedIndex]} alt={`${productName} - Image ${selectedIndex + 1}`} />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`gallery-thumb ${idx === selectedIndex ? 'active' : ''}`}
              onClick={() => setSelectedIndex(idx)}
            >
              <img src={img} alt={`${productName} thumbnail ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
