const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser,updateProfilePicture,toggleMute,toggleBlock} = require('../controller/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const profilePicUpload = upload(
  'uploads/profilePics',
  ['image/jpeg', 'image/png', 'image/jpg']
);
// GET all users (except current logged-in user)
router.get('/', protect, getUsers);

// GET single user
router.get('/:id', protect, getUserById);

// PUT update user
router.patch('/update/:editId', protect, updateUser);

// DELETE user
router.delete('/delete/:id', protect, deleteUser);

router.put(
  '/user/profile-picture',
  protect,
  profilePicUpload.single('profilePic'), 
  updateProfilePicture
);
router.patch('/user/:id/toggle-mute',protect,toggleMute);

router.patch('/user/:id/toggle-block', protect, toggleBlock);
module.exports = router; 