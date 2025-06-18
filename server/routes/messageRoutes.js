const express = require('express');
const router = express.Router();
const messageController = require('../controller/messageController');
const {protect} = require('../middleware/authMiddleware');

router.post('/', protect, messageController.sendMessage);
router.get('/:conversationId', protect, messageController.getMessages);
router.patch('/read', protect, messageController.markMessagesAsRead);
router.patch('/:id', protect, messageController.updateMessage);
router.delete('/:id', protect, messageController.deleteMessage);
module.exports = router;
