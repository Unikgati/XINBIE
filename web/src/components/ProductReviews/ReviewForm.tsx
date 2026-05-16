'use client';

import { useState, useMemo } from 'react';
import styles from './ProductReviews.module.css';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_SEEDS = ['Felix', 'Anita', 'Leo', 'Mia', 'Max', 'Zoe'];

export default function ReviewForm({ productId, onSuccess, isOpen, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_SEEDS[0]);

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
    formData.append('avatar', selectedAvatar); // Send avatar seed
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
      setSelectedAvatar(AVATAR_SEEDS[0]);
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Generate avatar URIs
  const avatarUris = useMemo(() => {
    return AVATAR_SEEDS.map(seed => {
      return createAvatar(adventurer, { seed }).toDataUri();
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.formContainer} style={{ marginTop: 0, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 className={styles.formTitle} style={{ margin: 0 }}>Tulis Ulasan Baru</h3>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span> Batal
        </button>
      </div>
          
          {message && (
            <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Avatar Selection */}
            <div className={styles.avatarSection}>
              <label className={styles.sectionLabel}>Pilih Avatar Anda</label>
              <div className={styles.avatarGrid}>
                {AVATAR_SEEDS.map((seed, i) => (
                  <div 
                    key={seed} 
                    className={`${styles.avatarOption} ${selectedAvatar === seed ? styles.selectedAvatar : ''}`}
                    onClick={() => setSelectedAvatar(seed)}
                  >
                    <img src={avatarUris[i]} alt={`avatar-${seed}`} />
                  </div>
                ))}
              </div>
            </div>

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
                      <button type="button" className={styles.removeImageBtn} onClick={() => setImages(images.filter((_, idx) => idx !== i))}>
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <div className={styles.spinnerRow}>
                  <div className={styles.spinnerRing} />
                  <span>Mengirim...</span>
                </div>
              ) : 'Kirim Ulasan'}
            </button>
          </form>
    </div>
  );
}
