'use client';

import { useState, useRef, useEffect } from 'react';

interface ActionMenuItem {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

/// 3-dot kebab action menu for table rows.
export default function ActionMenu({ items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="action-menu-wrapper" ref={ref}>
      <button
        className="btn btn-outline btn-icon action-menu-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      {open && (
        <div className="action-menu-dropdown">
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
        </div>
      )}
    </div>
  );
}
