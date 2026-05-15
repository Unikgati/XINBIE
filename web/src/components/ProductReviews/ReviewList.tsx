'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './ProductReviews.module.css';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  images: string[];
  avatar?: string | null;
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

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImages, setActiveImages] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const avatarUris = useMemo(() => {
    const map: Record<string, string> = {};
    reviews.forEach(r => {
      if (r.avatar && !map[r.avatar]) {
        map[r.avatar] = createAvatar(adventurer, { seed: r.avatar }).toDataUri();
      }
    });
    return map;
  }, [reviews]);

  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage);
    }
  }, [page, totalPages, loading, fetchReviews]);

  useEffect(() => {
    if (reviews.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    const loader = document.querySelector('#review-end-trigger');
    if (loader) observer.observe(loader);
    return () => observer.disconnect();
  }, [reviews.length, handleLoadMore]);

  const openLightbox = (images: string[], index: number) => {
    setActiveImages(images);
    setPhotoIndex(index);
    setLightboxOpen(true);
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

  const ReviewSkeleton = () => (
    <div className={`${styles.reviewCard} ${styles.skeleton}`}>
      <div className={styles.reviewHeader}>
        <div className={`${styles.avatar} ${styles.shimmer}`}></div>
        <div style={{ flex: 1 }}>
          <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '40%', height: 14 }}></div>
          <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '25%', height: 10, marginTop: 6 }}></div>
        </div>
      </div>
      <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '100%', height: 16, marginTop: 12 }}></div>
      <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '80%', height: 16, marginTop: 8 }}></div>
    </div>
  );

  return (
    <div className={styles.listContainer} style={{ marginTop: 0 }}>
      
      {reviews.length === 0 && !loading ? (
        null
      ) : (
        <div className={styles.reviewsWrapper}>
          {reviews.map(review => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.avatar}>
                  {review.avatar ? (
                    <img 
                      src={avatarUris[review.avatar]} 
                      alt={review.userName} 
                      loading="lazy"
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }} 
                    />
                  ) : (
                    review.userName.charAt(0).toUpperCase()
                  )}
                </div>
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
                    <img 
                      key={i} 
                      src={img} 
                      alt={`review-${i}`} 
                      loading="lazy"
                      className={styles.reviewImage} 
                      onClick={() => openLightbox(review.images, i)} 
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <>
              <ReviewSkeleton />
              <ReviewSkeleton />
            </>
          )}
          
          <div id="review-end-trigger" style={{ height: 10 }}></div>
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={photoIndex}
        slides={activeImages.map(src => ({ src }))}
      />
    </div>
  );
}
