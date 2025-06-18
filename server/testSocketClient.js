// testSocketClient.js
const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';
const CONVERSATION_ID = '68344e4529f5b3e1537f1b50';
const USER_ID = 'ut-user-123';

const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log(`✅ Connected with id: ${socket.id}`);

  socket.emit('joinRoom', CONVERSATION_ID);
  console.log(`➡️ Joined room: ${CONVERSATION_ID}`);

  socket.on('message-received', (message) => {
    console.log('📩 Message received:', message);
  });

  socket.on('message-edited', (updatedMessage) => {
    console.log('📝 Message edited:', updatedMessage);
  });

  socket.on('message-deleted', (data) => {
    console.log('🗑️ Message deleted:', data);
  });

  socket.on('message-read', ({ userId, conversationId }) => {
    console.log(`👀 User ${userId} read messages in conversation ${conversationId}`);
  });

  socket.on('group-updated', (updatedGroup) => {
    console.log('👥 Group updated:', updatedGroup);
  });

  socket.on('member-added', (newMember) => {
    console.log('➕ New member added:', newMember);
  });

  setTimeout(() => {
    const testMessage = {
      _id: 'fakeMessageId123',
      sender: USER_ID,
      text: 'Hello from test client!',
      conversation: CONVERSATION_ID,
    };
    socket.emit('new-message', testMessage);
    console.log('🚀 Sent test new-message event');
  }, 3000);

  setTimeout(() => {
    socket.emit('typing', { roomId: CONVERSATION_ID, userId: USER_ID });
    console.log('⌨️ Typing...');
  }, 5000);

  setTimeout(() => {
    socket.emit('stop-typing', { roomId: CONVERSATION_ID, userId: USER_ID });
    console.log('✋ Stopped typing');
  }, 8000);

  setTimeout(() => {
    socket.emit('message-read', { conversationId: CONVERSATION_ID, userId: USER_ID });
    console.log('👁️ Emitted message-read');
  }, 10000);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});
