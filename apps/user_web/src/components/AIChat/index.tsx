'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './AIChat.module.css';
import { api } from '@/lib/api';
import Link from 'next/link';

import { useAuthStore } from '@/store/authStore';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendations?: {
    products: any[];
    promos: any[];
    showWhatsApp?: boolean;
  };
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  sender: 'ai',
  text: 'Halo! Kenalin, gue Bro Cool, asisten belanja gaul DapurGizi. Ada yang bisa gue bantu cari produk hari ini? 😎🥦'
};

export default function AIChat() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id || 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isProductDetail = pathname.startsWith('/product/');

  // Storage keys scoped to user
  const STORAGE_KEY_MESSAGES = `dapurgizi_ai_messages_${userId}`;
  const STORAGE_KEY_OPEN = `dapurgizi_ai_open_${userId}`;

  // Load from localStorage on mount or when user changes
  useEffect(() => {
    const savedOpen = localStorage.getItem(STORAGE_KEY_OPEN);
    setIsOpen(savedOpen === 'true');

    const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        setMessages([INITIAL_MESSAGE]);
      }
    } else {
      setMessages([INITIAL_MESSAGE]);
    }

    // Check AI status from backend
    api.get<any>('/chat/status')
      .then(res => setIsOnline(res.online))
      .catch(() => setIsOnline(false));
  }, [userId, STORAGE_KEY_MESSAGES, STORAGE_KEY_OPEN]);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OPEN, isOpen.toString());
  }, [isOpen, STORAGE_KEY_OPEN]);

  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== '1')) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    }
  }, [messages, STORAGE_KEY_MESSAGES]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const hiddenRoutes = ['/login', '/register', '/forgot-password', '/otp', '/reset-password'];
  if (hiddenRoutes.includes(pathname)) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (input.length > 500) {
      alert('Pesan terlalu panjang (maksimal 500 karakter)');
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    const newMessages = [...messages, userMsg];
    
    // Keep only last 50 messages for performance and storage limits
    const cappedMessages = newMessages.slice(-50);
    
    setMessages(cappedMessages);
    setInput('');
    setLoading(true);

    try {
      // Send last 10 messages for context (more than 5 for better conversation)
      const history = cappedMessages.slice(-10).map(m => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

      const res = await api.post<any>('/chat/message', { message: userMsg.text, history });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.replyText,
        recommendations: res.recommendations
      };
      
      setMessages(prev => [...prev, aiMsg].slice(-50));
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}-${Math.random()}`,
        sender: 'ai',
        text: err.message || 'Maaf, terjadi gangguan pada sistem AI. Silakan coba lagi nanti.',
        recommendations: {
          products: [],
          promos: [],
          showWhatsApp: true
        }
      };
      setMessages(prev => [...prev, errMsg].slice(-50));
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Dynamic bottom positions for mobile/desktop
  const getBubbleBottom = () => {
    if (isHome) return '110px';
    if (isProductDetail) return '200px';
    return '85px';
  };

  const getWindowBottom = () => {
    if (isHome) return '170px';
    if (isProductDetail) return '260px';
    return '145px';
  };

  return (
    <>
      <div 
        className={styles.bubble} 
        onClick={() => setIsOpen(!isOpen)}
        style={{ '--mobile-bottom': getBubbleBottom() } as any}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
          {isOpen ? 'close' : 'support_agent'}
        </span>
      </div>

      {isOpen && (
        <div 
          className={styles.chatWindow}
          style={{ '--mobile-bottom-window': getWindowBottom() } as any}
        >
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <h3>Bro Cool</h3>
              <div className={styles.headerStatus}>
                <div 
                  className={styles.statusDot} 
                  style={{ 
                    background: isOnline ? '#2ecc71' : '#95a5a6',
                    boxShadow: isOnline ? '0 0 8px #2ecc71' : 'none'
                  }}
                ></div>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
            <button style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>

          <div className={styles.chatBody} ref={scrollRef}>
            {messages.map(m => (
              <div key={m.id} className={`${styles.message} ${m.sender === 'ai' ? styles.aiMsg : styles.userMsg}`}>
                <div>{m.text}</div>
                
                {m.recommendations && (
                  <div className={styles.cardList}>
                    {m.recommendations.products.map(p => (
                      <div key={p.id} className={styles.productCard}>
                        <img src={p.images[0]} alt={p.name} className={styles.cardImg} />
                        <div className={styles.cardContent}>
                          <p className={styles.cardName}>{p.name}</p>
                          <p className={styles.cardCategory}>{p.category?.name || 'Produk'}</p>
                          <div className={styles.cardInfo}>
                            <span className={styles.cardPrice}>Rp {formatRp(p.discountPrice || p.price)}</span>
                            <Link href={`/product/${p.slug}`} style={{ textDecoration: 'none' }}>
                              <button className={styles.viewBtn}>Lihat</button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}

                    {m.recommendations.promos.map(pr => (
                      <div key={pr.code} style={{ background: '#fff9e6', padding: '10px', borderRadius: '12px', border: '1px dashed #f39c12', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#f39c12' }}>sell</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700 }}>{pr.code}</p>
                          <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>
                            {pr.type === 'PERCENT' ? `Diskon ${pr.value}%` : `Potongan Rp ${formatRp(pr.value)}`}
                          </p>
                        </div>
                      </div>
                    ))}

                    {m.recommendations.showWhatsApp && (
                      <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '12px', border: '1px solid #2ecc71', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#075E54' }}>Customer Service DapurGizi</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Tanya admin langsung via WhatsApp</p>
                        </div>
                        <a 
                          href="https://wa.me/6285961462361" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            background: '#25D366', 
                            color: '#fff', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px', 
                            borderRadius: '10px', 
                            fontSize: '14px', 
                            fontWeight: 700,
                            textDecoration: 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Chat Sekarang
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className={`${styles.message} ${styles.aiMsg}`} style={{ width: 'fit-content' }}>
                <div className={styles.typing}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.chatFooter}>
            <div className={styles.inputWrapper}>
              <input 
                type="text" 
                placeholder="Tanya stok atau harga produk..." 
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className={styles.sendBtn} onClick={handleSend} disabled={loading}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
    </>
  );
}
