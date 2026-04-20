'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ActionMenuItem {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

/// 3-dot kebab action menu — uses portal + fixed positioning
/// so it's never clipped by table/card overflow.
export default function ActionMenu({ items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 180;
    const dropdownHeight = items.length * 40 + 16; // estimate

    let top = rect.bottom + 4;
    let left = rect.right - dropdownWidth;

    // Flip up if near bottom
    if (top + dropdownHeight > window.innerHeight - 16) {
      top = rect.top - dropdownHeight - 4;
    }
    // Ensure not off-screen left
    if (left < 8) left = 8;

    setPos({ top, left });
  }, [items.length]);

  const toggle = () => {
    if (!open) calcPosition();
    setOpen(!open);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className="btn btn-outline btn-icon action-menu-trigger"
        onClick={toggle}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="action-menu-dropdown"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              className={`action-menu-item ${item.danger ? 'danger' : ''}`}
              onClick={() => { item.onClick(); setOpen(false); }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
