const User = require('../model/user');

// GET all users (for chat list, exclude self)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    console.log(users)
    res.json(users);
  } catch (error) {
    res.status(400).json({
      status: "Fail",
      message: error.message,
    });
    console.log("Authenticated user:", req.user);

};
};
// GET /conversation/:conversationId/participant
exports.getOtherParticipant = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const otherUserId = conversation.participants.find(
      (id) => id.toString() !== req.user._id.toString()
    );

    const otherUser = await User.findById(otherUserId).select('-password');
    if (!otherUser) return res.status(404).json({ message: 'User not found' });

    res.json(otherUser); // ✅ includes bio, profilePic, username, email, etc.
  } catch (error) {
    console.error('Error getting other participant:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  }catch (error) {
    res.status(400).json({
      status: "Fail",
      message: error.message,
    });
}
};
exports.updateUser = async (req, res) => {
  try {
    const editId = req.params.editId;
    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(editId, updates, {
      new: true,
      runValidators: true,
      
    });
// console.log("Edit ID:", req.params.editId);
// console.log("Update Body:", req.body);

    if (!updatedUser) {
      return res.status(404).json({
        status: "Fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update error:", error.message);
    res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};


// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({
      status: "Deletation Fail",
      message: error.message,
    });
}
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email,bio } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio) updateData.bio = bio;
    if (req.file) {
      updateData.profilePic = `/uploads/profilePics/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
exports.toggleMute = async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id;

  try {
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyMuted = currentUser.mutedUsers.includes(targetUserId);

    if (alreadyMuted) {
      currentUser.mutedUsers = currentUser.mutedUsers.filter(
        (id) => id.toString() !== targetUserId
      );
    } else {
      currentUser.mutedUsers.push(targetUserId);
    }

    await currentUser.save();

    res.status(200).json({
      message: alreadyMuted ? 'User unmuted successfully' : 'User muted successfully',
    });
  } catch (error) {
    console.error('Mute toggle failed:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.toggleBlock = async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id;

  try {
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyBlocked = currentUser.blockedUsers.includes(targetUserId);

    if (alreadyBlocked) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (id) => id.toString() !== targetUserId
      );
    } else {
      currentUser.blockedUsers.push(targetUserId);
    }

    await currentUser.save();

    res.status(200).json({
      message: alreadyBlocked ? 'User unblocked successfully' : 'User blocked successfully',
    });
  } catch (error) {
    console.error('Block toggle failed:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
