// Server Component
import type { Review } from '@shared/types';
import { getUserById } from '@/lib/data';
import { ReviewForm } from './ReviewForm';

interface ProductReviewsProps {
  reviews: Review[];
  productId: string;
  avgRating: number;
  reviewCount: number;
}

export async function ProductReviews({
  reviews,
  productId,
  avgRating,
  reviewCount,
}: ProductReviewsProps) {
  const reviewsWithUsers = await Promise.all(
    reviews.map(async review => {
      const user = await getUserById(review.userId);
      return { ...review, user };
    })
  );

  return (
    <section className="reviews-section">
      <div className="container">
        <div className="reviews-header">
          <div className="reviews-summary">
            <span className="rating-big">{avgRating.toFixed(1)}</span>
            <div>
              <div className="rating-stars" style={{ fontSize: '1.5rem' }}>
                {'★'.repeat(Math.round(avgRating))}
                {'☆'.repeat(5 - Math.round(avgRating))}
              </div>
              <div style={{ color: 'var(--color-text-light)' }}>
                Based on {reviewCount} reviews
              </div>
            </div>
          </div>
          <ReviewForm productId={productId} />
        </div>

        <div className="reviews-list">
          {reviewsWithUsers.map(review => (
            <article key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-author">
                  {review.user?.avatarUrl && (
                    <img
                      src={review.user.avatarUrl}
                      alt={`${review.user.firstName}'s avatar`}
                      className="review-avatar"
                    />
                  )}
                  <div>
                    <div className="review-name">
                      {review.user?.firstName} {review.user?.lastName}
                    </div>
                    <div className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="rating-stars">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </div>
              </div>

              {review.title && <h4 className="review-title">{review.title}</h4>}
              <p className="review-content">{review.content}</p>

              {(review.pros.length > 0 || review.cons.length > 0) && (
                <div className="review-pros-cons">
                  {review.pros.length > 0 && (
                    <div>
                      <strong>Pros:</strong>
                      <ul className="pros-list">
                        {review.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons.length > 0 && (
                    <div>
                      <strong>Cons:</strong>
                      <ul className="cons-list">
                        {review.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {review.verifiedPurchase && (
                <div style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--color-success)' }}>
                  ✓ Verified Purchase
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
