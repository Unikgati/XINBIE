import React from 'react';

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ width: '100%' }}>
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={`th-${i}`}>
                <div className="skeleton" style={{ height: 16, width: `${50 + (i % 3) * 15}%`, borderRadius: 4 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={`tr-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={`td-${rowIndex}-${colIndex}`}>
                  <div className="skeleton" style={{ height: 20, width: `${60 + ((rowIndex + colIndex) % 4) * 10}%`, borderRadius: 4 }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ border: '1px solid var(--divider)' }}>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 24, width: '80%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

export function FormSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: 20 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`form-${i}`} style={{ marginBottom: 16 }}>
          <div className="skeleton" style={{ height: 14, width: '20%', borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 42, width: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
      ))}
    </div>
  );
}
