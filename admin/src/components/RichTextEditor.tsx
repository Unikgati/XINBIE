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
    <div className={`rich-text-wrapper ${loading ? 'is-loading' : ''}`}>
      <textarea
        className="form-input"
        style={{ 
          minHeight: 140, 
          paddingTop: 12,
          lineHeight: '1.6',
          resize: 'vertical'
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
      />
    </div>
  );
}
