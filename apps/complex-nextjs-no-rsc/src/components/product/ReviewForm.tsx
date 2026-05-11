'use client';

import { useState } from 'react';

interface ReviewFormProps {
  productId: string;
}

export function ReviewForm({ productId }: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, content }),
      });
      setIsOpen(false);
      setTitle('');
      setContent('');
      setRating(5);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        Write a Review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '500px' }}>
      <div className="form-group">
        <label className="form-label">Rating</label>
        <div style={{ display: 'flex', gap: '4px', fontSize: '1.5rem' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {star <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          type="text"
          className="form-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summary of your review"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Review</label>
        <textarea
          className="form-input"
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share your experience..."
          required
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
