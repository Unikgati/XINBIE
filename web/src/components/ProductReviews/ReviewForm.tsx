'use client';

import { useState } from 'react';
import styles from './ProductReviews.module.css';

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
}

export default function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(f => {
        if (f.size > 2 * 1024 * 1024) {
          setMessage({ type: 'error', text: 'Ukuran file maksimal 2MB' });
          return false;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
          setMessage({ type: 'error', text: 'Hanya format JPG/PNG/WEBP yang diizinkan' });
          return false;
        }
        return true;
      });
      setImages(prev => [...prev, ...validFiles].slice(0, 3)); // Max 3 images
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setMessage({ type: 'error', text: 'Nama wajib diisi' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('userName', userName);
    formData.append('rating', rating.toString());
    if (comment) formData.append('comment', comment);
    
    images.forEach(img => {
      formData.append('images', img);
    });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${baseUrl}/products/${productId}/reviews`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Gagal mengirim ulasan');

      setMessage({ type: 'success', text: data.message || 'Ulasan berhasil dikirim dan sedang menunggu persetujuan.' });
      setUserName('');
      setComment('');
      setRating(5);
      setImages([]);
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h3 className={styles.formTitle}>Tulis Ulasan Anda</h3>
      
      {message && (
        <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.ratingSelect}>
          {[1, 2, 3, 4, 5].map(star => (
            <span 
              key={star}
              className={`material-symbols-outlined ${styles.starSelect}`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              style={{ 
                fontVariationSettings: star <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0",
                color: star <= (hoverRating || rating) ? '#f59e0b' : '#e5e7eb'
              }}
            >
              star
            </span>
          ))}
          <span className={styles.ratingText}>{rating} dari 5</span>
        </div>

        <div className={styles.inputGroup}>
          <input 
            type="text" 
            placeholder="Nama Anda" 
            className={styles.input}
            value={userName}
            onChange={e => setUserName(e.target.value)}
            maxLength={50}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <textarea 
            placeholder="Bagikan pengalaman Anda (Opsional)" 
            className={styles.textarea}
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            maxLength={500}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.fileLabel}>
            <span className="material-symbols-outlined">add_photo_alternate</span>
            Tambah Foto (Maks 3, @2MB)
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              multiple 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          {images.length > 0 && (
            <div className={styles.imagePreviewContainer}>
              {images.map((img, i) => (
                <div key={i} className={styles.imagePreview}>
                  <img src={URL.createObjectURL(img)} alt={`preview-${i}`} />
                  <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}>&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Mengirim...' : 'Kirim Ulasan'}
        </button>
      </form>
    </div>
  );
}
