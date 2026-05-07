'use client';

import React from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
}

/**
 * Simplified to a standard textarea as per user request to avoid heavy HTML rendering.
 */
export default function RichTextEditor({ value, onChange, placeholder, loading }: RichTextEditorProps) {
  return (
    <div className={`rich-text-wrapper ${loading ? 'is-loading' : ''}`} style={{ position: 'relative' }}>
      <textarea
        className="form-input"
        style={{ 
          minHeight: 140, 
          paddingTop: 12,
          lineHeight: '1.6',
          resize: 'vertical',
          // Show normal placeholder when not loading, hide when loading (we show custom shimmer)
          color: loading ? 'transparent' : 'inherit'
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={loading ? "" : placeholder}
        disabled={loading}
      />
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: 13, 
          left: 15, 
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <span style={{ 
            fontSize: 14, 
            fontWeight: 500, 
            fontStyle: 'italic',
            animation: 'text-shimmer 2s infinite linear',
            background: 'linear-gradient(90deg, var(--text-hint) 0%, var(--primary) 50%, var(--text-hint) 100%)',
            backgroundSize: '200% auto',
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            display: 'inline-block'
          }}>
            {placeholder}
          </span>
        </div>
      )}
    </div>
  );
}
