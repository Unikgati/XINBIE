'use client';

import { useState, useEffect } from 'react';
import styles from './FlashSaleSection.module.css';

interface Props {
  endTime: string;
}

export default function FlashSaleCountdown({ endTime }: Props) {
  const [timeLeft, setTimeLeft] = useState<{h: string, m: string, s: string} | null>(null);

  useEffect(() => {
    const calculate = () => {
      const difference = +new Date(endTime) - +new Date();
      if (difference > 0) {
        const h = Math.floor(difference / (1000 * 60 * 60));
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);
        
        setTimeLeft({
          h: h.toString().padStart(2, '0'),
          m: m.toString().padStart(2, '0'),
          s: s.toString().padStart(2, '0')
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) return <div className={styles.timer}>Berakhir</div>;

  return (
    <div className={styles.timer}>
      <div className={styles.timeUnits}>
        <div className={styles.timeUnit}>{timeLeft.h}</div>
        <span>:</span>
        <div className={styles.timeUnit}>{timeLeft.m}</div>
        <span>:</span>
        <div className={styles.timeUnit}>{timeLeft.s}</div>
      </div>
    </div>
  );
}
