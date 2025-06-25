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
  getOtherParticipant,
  getAllUsers,
  markMessagesAsRead,
  getConversationDetails,
  updateGroupChat
} = require('../controller/conversationController');
const upload = multer({ dest: 'uploads/groupPics/' }); 

router.get("/all", protect, getAllUsers);
router.post('/', protect, createOrGetConversation); // Create/get one-to-one convo
router.get('/:conversationId/participant', protect, getOtherParticipant);
router.get('/', protect, getUserConversations);     // Get all user's convos
router.post('/group',protect,upload.single('groupPic'),createGroupChat);//create a group chat
router.patch('/group/add-member', protect, addMemberToGroup);
router.patch('/group/remove-member', protect, removeGroupMember);
router.delete('/group/delete-group/:id', protect, deleteGroupChat);
router.post('/mark-as-read', protect, markMessagesAsRead);
router.get('/details/:conversationId', protect,getConversationDetails);
router.patch('/group/update', protect, upload.single('groupPic'), updateGroupChat);


module.exports = router;
