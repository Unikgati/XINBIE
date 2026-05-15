'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './ProductReviews.module.css';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string;
}

interface ReviewListProps {
  productId: string;
  refreshTrigger: number;
}

export default function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReviews = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${baseUrl}/products/${productId}/reviews?page=${pageNum}&limit=5`);
      const json = await res.json();
      
      if (res.ok && json.data) {
        if (pageNum === 1) {
          setReviews(json.data);
        } else {
          setReviews(prev => [...prev, ...json.data]);
        }
        setTotalPages(json.meta.totalPages);
        setTotal(json.meta.total);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    setPage(1);
    fetchReviews(1);
  }, [productId, refreshTrigger, fetchReviews]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: i <= rating ? "'FILL' 1" : "'FILL' 0" }}>
            star
          </span>
        ))}
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return <div className={styles.loading}>Memuat ulasan...</div>;
  }

  return (
    <div className={styles.listContainer}>
      <h3 className={styles.listTitle}>Ulasan Pembeli ({total})</h3>
      
      {reviews.length === 0 ? (
        <div className={styles.empty}>Belum ada ulasan untuk produk ini. Jadilah yang pertama!</div>
      ) : (
        <div className={styles.reviewsWrapper}>
          {reviews.map(review => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.avatar}>{review.userName.charAt(0).toUpperCase()}</div>
                <div>
                  <div className={styles.userName}>{review.userName}</div>
                  <div className={styles.date}>{new Date(review.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
              
              {renderStars(review.rating)}
              
              {review.comment && <div className={styles.comment}>{review.comment}</div>}
              
              {review.images && review.images.length > 0 && (
                <div className={styles.reviewImages}>
                  {review.images.map((img, i) => (
                    <img key={i} src={img} alt={`review-${i}`} className={styles.reviewImage} onClick={() => window.open(img, '_blank')} />
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {page < totalPages && (
            <button className={styles.loadMoreBtn} onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
