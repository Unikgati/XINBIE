'use client';

import React from 'react';
import styles from './ProductDetail.module.css';

interface CookingVideo {
  id: string;
  title: string;
  youtubeUrl: string;
}

interface CookingVideoSectionProps {
  videos: CookingVideo[];
}

export default function CookingVideoSection({ videos }: CookingVideoSectionProps) {
  if (!videos || videos.length === 0) return null;

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  return (
    <section className={styles.descriptionSection} style={{ marginTop: '32px' }}>
      <div className={styles.divider} style={{ marginBottom: '32px' }} />
      <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>play_circle</span>
        Inspirasi Masak
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '16px',
        marginTop: '16px' 
      }}>
        {videos.map((video) => {
          const ytId = getYoutubeId(video.youtubeUrl);
          
          return (
            <div key={video.id} style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #eee'
            }}>
              {ytId ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                  <iframe
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div style={{ height: '160px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ccc' }}>play_circle</span>
                </div>
              )}
              <div style={{ padding: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#333', lineHeight: 1.4 }}>
                  {video.title}
                </h4>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
