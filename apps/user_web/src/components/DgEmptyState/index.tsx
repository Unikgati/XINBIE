import React from 'react';
import Link from 'next/link';
import styles from './index.module.css';

interface DgEmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}

const DgEmptyState: React.FC<DgEmptyStateProps> = ({ 
  icon, 
  title, 
  subtitle, 
  actionLabel, 
  actionHref 
}) => {
  return (
    <div className={styles.container}>
      {icon && (
        <div className={styles.iconWrapper}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      )}
      <h2 className={styles.title}>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={styles.actionBtn}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default DgEmptyState;
