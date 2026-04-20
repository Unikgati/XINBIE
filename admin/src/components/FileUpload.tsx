'use client';

import { useRef, useState } from 'react';

interface FileUploadProps {
  accept?: string;
  label?: string;
  hint?: string;
  icon?: string;
  preview?: string;
  previewBg?: string;
  maxSize?: number; // KB
  onChange: (file: File) => void;
  onError?: (msg: string) => void;
}

export default function FileUpload({
  accept = 'image/*',
  label = 'Drag & drop atau klik untuk upload',
  hint,
  icon = 'cloud_upload',
  preview,
  previewBg,
  maxSize = 2048,
  onChange,
  onError,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayPreview = localPreview || preview;

  const handleFile = (file: File) => {
    if (maxSize && file.size > maxSize * 1024) {
      onError?.(`Ukuran file maksimal ${maxSize}KB`);
      return;
    }
    // Show preview for images
    if (file.type.startsWith('image/')) {
      setLocalPreview(URL.createObjectURL(file));
    }
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`file-upload ${dragOver ? 'drag-over' : ''} ${displayPreview ? 'has-preview' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {displayPreview ? (
        <div className="file-upload-preview">
          <div className="file-upload-thumb" style={{ background: previewBg || 'var(--divider)' }}>
            <img src={displayPreview} alt="Preview" />
          </div>
          <div className="file-upload-meta">
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>check_circle</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>File dipilih</span>
            <span className="file-upload-change">Ganti</span>
          </div>
        </div>
      ) : (
        <div className="file-upload-empty">
          <div className="file-upload-icon-circle">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div className="file-upload-label">{label}</div>
          {hint && <div className="file-upload-hint">{hint}</div>}
        </div>
      )}
    </div>
  );
}
