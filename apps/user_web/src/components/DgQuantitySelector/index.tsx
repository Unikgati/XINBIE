'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './DgQuantitySelector.module.css';

interface Props {
  quantity: number;
  onChanged: (qty: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
  large?: boolean;
  editable?: boolean;
}

export default function DgQuantitySelector({
  quantity,
  onChanged,
  min = 0,
  max = 99,
  compact = false,
  large = false,
  editable = false,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(quantity));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const clamp = (val: number) => Math.max(min, Math.min(max, val));

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > min) {
      onChanged(quantity - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < max) {
      onChanged(quantity + 1);
    }
  };

  const commitInput = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      onChanged(clamp(parsed));
    } else {
      setInputValue(String(quantity));
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitInput();
    } else if (e.key === 'Escape') {
      setInputValue(String(quantity));
      setIsEditing(false);
    }
  };

  const sizeClass = compact ? styles.compact : large ? styles.large : '';

  return (
    <div 
      className={`${styles.container} ${sizeClass}`} 
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <button 
        className={styles.button} 
        onClick={handleDecrement}
        disabled={quantity <= min}
        aria-label="Kurangi"
        type="button"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      
      {editable && !compact ? (
        isEditing ? (
          <input
            ref={inputRef}
            type="number"
            className={styles.quantityInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={commitInput}
            onKeyDown={handleInputKeyDown}
            min={min}
            max={max}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className={styles.quantity} 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            style={{ cursor: 'text' }}
            title="Klik untuk edit"
          >
            {quantity}
          </span>
        )
      ) : (
        <span className={styles.quantity}>{quantity}</span>
      )}
      
      <button 
        className={`${styles.button} ${styles.addButton}`} 
        onClick={handleIncrement}
        disabled={quantity >= max}
        aria-label="Tambah"
        type="button"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
