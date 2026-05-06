import React from 'react';
import './DgSkeleton.css';

interface DgSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
  className?: string;
  count?: number;
}

const DgSkeleton: React.FC<DgSkeletonProps> = ({ 
  width, 
  height, 
  borderRadius, 
  circle, 
  className = '',
  count = 1
}) => {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div 
          key={i}
          className={`dg-skeleton ${circle ? 'dg-skeleton-circle' : ''} ${className}`}
          style={{
            width: width || '100%',
            height: height || '16px',
            borderRadius: circle ? '50%' : (borderRadius || '8px'),
          }}
        />
      ))}
    </>
  );
};

export default DgSkeleton;
