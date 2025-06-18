const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

const {
  createOrGetConversation,
  getUserConversations,
  createGroupChat,
  addMemberToGroup,
  removeGroupMember,
  deleteGroupChat,
  getOtherParticipant
} = require('../controller/conversationController');
const upload = multer({ dest: 'uploads/groupPics/' }); 
router.post('/', protect, createOrGetConversation); // Create/get one-to-one convo
router.get('/:conversationId/participant', protect, getOtherParticipant);
router.get('/', protect, getUserConversations);     // Get all user's convos
router.post('/group',protect,upload.single('groupPic'),createGroupChat);//create a group chat
router.patch('/group/add-member', protect, addMemberToGroup);
router.patch('/group/remove-member', protect, removeGroupMember);
router.delete('/group/delete-group/:id', protect, deleteGroupChat);


module.exports = router;
