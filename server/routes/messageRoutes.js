const express = require("express");
const router = express.Router();
const messageController = require("../controller/messageController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const messageFileUpload = upload("uploads/");
router.post(
  "/send",
  protect,
  messageFileUpload.single("file"),
  messageController.sendMessage
);
router.get("/:conversationId", protect, messageController.getMessages);
router.patch("/read", protect, messageController.markMessagesAsRead);
router.patch("/:id", protect, messageController.updateMessage);
router.delete("/:id", protect, messageController.deleteMessage);
router.post("/add-reaction", protect, messageController.addReaction);

module.exports = router;
