const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminProtect");
const adminController = require("../controller/adminController");

// User management
router.get("/users", protect, isAdmin, adminController.getAllUsers);
router.delete("/users/:id", protect, isAdmin, adminController.deleteUser);
router.patch("/users/:id/block", protect, isAdmin, adminController.toggleBlockUser);

// Group management (from conversations where isGroup: true)
router.get("/groups", protect, isAdmin, adminController.getAllGroups);
router.delete("/groups/:id", protect, isAdmin, adminController.deleteGroup);

// Conversation management
router.get("/conversations", protect, isAdmin, adminController.getAllConversations);
router.delete("/messages/:id", protect, isAdmin, adminController.deleteMessage);

// Message management
router.get("/messages/:conversationId", protect, isAdmin, adminController.getMessagesByConversationId);
router.delete("/messages/:id", protect, isAdmin, adminController.deleteMessageById);

module.exports = router;
