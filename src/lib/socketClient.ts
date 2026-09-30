import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('[SocketClient] Connected to server engine:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('[SocketClient] Disconnected:', reason);
});
