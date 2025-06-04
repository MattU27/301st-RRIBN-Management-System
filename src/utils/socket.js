const { Server: SocketIOServer } = require('socket.io');

const initSocketServer = (server) => {
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
  global.io = io;

  return io;
};

// Helper to emit events from anywhere in the app
const emitSocketEvent = (event, data) => {
  const io = global.io;
  if (io) {
    io.emit(event, data);
    console.log(`Socket event emitted: ${event}`, data);
  } else {
    console.log('Socket server not initialized');
  }
};

module.exports = {
  initSocketServer,
  emitSocketEvent
}; 