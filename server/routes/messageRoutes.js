const express = require("express");
const router = express.Router();
const messageController = require("../controller/messageController");
const { protect } = require("../middleware/authMiddleware");
const upload = require('../middleware/upload');
const profilePicUpload = upload(
  'uploads/messages',
  ['image/jpeg', 'image/png', 'image/jpg']
);
router.post(
  "/send",
  protect,
  profilePicUpload.single("file"),
  messageController.sendMessage
);
router.get("/:conversationId", protect, messageController.getMessages);
router.patch("/read", protect, messageController.markMessagesAsRead);
router.patch("/:id", protect, messageController.updateMessage);
router.delete("/:id", protect, messageController.deleteMessage);
router.post("/react", protect, messageController.reactToMessage);
module.exports = router;
