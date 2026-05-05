'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to prevent SSR window is not defined errors
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="quill-skeleton">Memuat Editor...</div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export default function RichTextEditor({ value, onChange, placeholder, loading }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      ['bold', 'italic'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'] // remove formatting button
    ],
  };

  const formats = [
    'bold', 'italic',
    'list'
  ];

  return (
    <div className={`rich-text-wrapper ${loading ? 'is-loading' : ''}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
