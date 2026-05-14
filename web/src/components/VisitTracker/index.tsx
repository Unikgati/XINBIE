'use client';
import { useEffect } from 'react';

export default function VisitTracker() {
  useEffect(() => {
    // Only count visit once per session
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      fetch(`${apiUrl}/visit`, { method: 'POST' }).catch(console.error);
      sessionStorage.setItem('hasVisited', 'true');
    }
  }, []);
  
  return null;
}
