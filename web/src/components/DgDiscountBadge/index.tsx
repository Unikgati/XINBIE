import React from 'react';
import styles from './DgDiscountBadge.module.css';

interface Props {
  discountPercent: number;
}

export default function DgDiscountBadge({ discountPercent }: Props) {
  return (
    <div className={styles.badgeContainer}>
      <div className={styles.mainBadge}>
        -{discountPercent}%
      </div>
      <div className={styles.foldTriangle}></div>
    </div>
  );
}
