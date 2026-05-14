'use client';

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

export const getSocket = () => {
  if (socket) return socket;

  const token = useAuthStore.getState().token;
  if (!token) return null;

  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  // Socket.io server is usually on the same URL as the API
  const socketUrl = NEXT_PUBLIC_API_URL.replace('/api', '');

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000,
  });

  socket.on('connect', () => {
    console.log('🔌 Connected to WebSocket');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from WebSocket');
  });

  socket.on('connect_error', (err) => {
    console.error('🔌 WebSocket connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
