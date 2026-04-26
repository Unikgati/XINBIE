import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  
  // Simple pagination logic for 5 visible buttons
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  
  if (currentPage <= 3) {
    end = Math.min(totalPages, 5);
  } else if (currentPage >= totalPages - 2) {
    start = Math.max(1, totalPages - 4);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'flex-end', 
      gap: 8, 
      padding: '16px 20px',
      borderTop: '1px solid var(--divider)'
    }}>
      <button 
        className="btn btn-outline btn-sm" 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ padding: '6px 10px', height: 'auto', minWidth: 'auto' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
      </button>

      {start > 1 && (
        <>
          <button 
            className={`btn btn-sm ${currentPage === 1 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange(1)}
            style={{ padding: '6px 12px', height: 'auto', minWidth: 'auto', borderColor: currentPage === 1 ? 'var(--primary-action)' : 'var(--border)' }}
          >
            1
          </button>
          {start > 2 && <span style={{ color: 'var(--text-hint)' }}>...</span>}
        </>
      )}

      {pages.map(page => (
        <button 
          key={page}
          className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onPageChange(page)}
          style={{ padding: '6px 12px', height: 'auto', minWidth: 'auto', borderColor: currentPage === page ? 'var(--primary-action)' : 'var(--border)' }}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--text-hint)' }}>...</span>}
          <button 
            className={`btn btn-sm ${currentPage === totalPages ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange(totalPages)}
            style={{ padding: '6px 12px', height: 'auto', minWidth: 'auto', borderColor: currentPage === totalPages ? 'var(--primary-action)' : 'var(--border)' }}
          >
            {totalPages}
          </button>
        </>
      )}

      <button 
        className="btn btn-outline btn-sm" 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ padding: '6px 10px', height: 'auto', minWidth: 'auto' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
      </button>
    </div>
  );
}
