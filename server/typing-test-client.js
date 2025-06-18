const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3000"; 
const ROOM_ID = "68344e4529f5b3e1537f1b50"; // Your conversation/room ID
const USER_ID = process.argv[2] || "ut-user-123"; // Pass different USER_ID via CLI arg or default

const socket = io(SERVER_URL);

socket.on("connect", () => {
  console.log(`✅ Connected to server: ${socket.id} as user ${USER_ID}`);

  // Join the conversation room
  socket.emit("joinRoom", ROOM_ID);
  console.log(`Joined room: ${ROOM_ID}`);

  // Simulate typing after 2 seconds
  setTimeout(() => {
    console.log("🚀 Emitting 'typing'");
    socket.emit("typing", { roomId: ROOM_ID, userId: USER_ID });
  }, 2000);

  // Simulate stop typing after 7 seconds
  setTimeout(() => {
    console.log("🛑 Emitting 'stop-typing'");
    socket.emit("stop-typing", { roomId: ROOM_ID, userId: USER_ID });
  }, 7000);

  // Simulate message read after 9 seconds
  setTimeout(() => {
    console.log("✅ Emitting 'message-read'");
    socket.emit("message-read", { conversationId: ROOM_ID, userId: USER_ID });
  }, 9000);
});

// Listen for typing events from others
socket.on("typing", ({ userId }) => {
  if (userId !== USER_ID) {
    console.log(`💬 User ${userId} is typing...`);
  }
});

socket.on("stop-typing", ({ userId }) => {
  if (userId !== USER_ID) {
    console.log(`💤 User ${userId} stopped typing.`);
  }
});

socket.on("message-read", ({ userId, conversationId }) => {
  if (userId !== USER_ID) {
    console.log(`👀 User ${userId} read messages in conversation ${conversationId}`);
  }
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
