import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// Socket.IO connects to the root, not /api
const WS_URL = API_BASE.replace('/api', '');

let socket: Socket | null = null;

export type SocketStatus = 'connected' | 'reconnecting' | 'disconnected';
let currentStatus: SocketStatus = 'disconnected';
const statusListeners = new Set<(status: SocketStatus) => void>();

function setStatus(s: SocketStatus) {
  if (s === currentStatus) return;
  currentStatus = s;
  statusListeners.forEach(fn => fn(s));
}

export function getSocketStatus(): SocketStatus {
  return currentStatus;
}

export function onSocketStatusChange(cb: (status: SocketStatus) => void): () => void {
  statusListeners.add(cb);
  return () => { statusListeners.delete(cb); };
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  if (!token) return null;

  // Already connected
  if (socket?.connected) return socket;

  // Disconnect old socket if exists
  if (socket) {
    socket.disconnect();
  }

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('🔌 Admin WebSocket connected');
    setStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Admin WebSocket disconnected:', reason);
    setStatus('disconnected');
  });

  socket.io.on('reconnect_attempt', () => {
    setStatus('reconnecting');
  });

  socket.on('connect_error', (err) => {
    console.warn('🔌 WebSocket error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    setStatus('disconnected');
  }
}

