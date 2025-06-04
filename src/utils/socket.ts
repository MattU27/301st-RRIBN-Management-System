import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';

export const initSocketServer = (server: NetServer) => {
  const io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Store the io instance globally
  (global as any).io = io;

  return io;
};

// Helper to emit events from anywhere in the app
export const emitSocketEvent = (event: string, data: any) => {
  const io = (global as any).io;
  if (io) {
    io.emit(event, data);
    console.log(`Socket event emitted: ${event}`, data);
  } else {
    console.log('Socket server not initialized');
  }
}; 