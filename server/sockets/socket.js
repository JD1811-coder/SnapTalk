// socket.js
const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`📥 Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('typing', { userId });
    });

    socket.on('stop-typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('stop-typing', { userId });
    });

    socket.on('message-read', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('message-read', { conversationId, userId });
    });

    socket.on('updateMessage', (updatedMessage) => {
      console.log('✏️ Message updated:', updatedMessage);
      const room = updatedMessage.conversationId;
      if (room) socket.to(room).emit('messageUpdated', updatedMessage);
    });

    socket.on('deleteMessage', ({ msgId, conversationId }) => {
      console.log('🗑️ Message deleted:', msgId);
      if (conversationId) {
        socket.to(conversationId).emit('messageDeleted', msgId);
      } else {
        socket.broadcast.emit('messageDeleted', msgId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket ${socket.id} disconnected`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('❌ Socket.io not initialized!');
  }
  return io;
}

module.exports = { initSocket, getIO };
