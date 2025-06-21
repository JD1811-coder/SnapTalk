const Conversation = require('../model/conversation');
const Message = require('../model/message');
const User = require('../model/user'); 

// ✅ Create or fetch one-to-one conversation
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude sensitive data
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createOrGetConversation = async (req, res) => {
  const { identifier } = req.body; // username or email

  if (!identifier) {
    return res.status(400).json({ message: 'Username or email is required' });
  }

  try {
    // 🔍 Find the user by username or email
    const otherUser = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🛑 Prevent chatting with self
    if (otherUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't chat with yourself" });
    }

    // 🔁 Try to find existing 1-1 conversation
    let conversation = await Conversation.findOne({
      isGroupChat: false,
      members: { $all: [req.user._id, otherUser._id] },
    }).populate('members', '-password');

    if (conversation) {
      return res.status(200).json(conversation);
    }

    // ✨ No conversation? Create new
    conversation = await Conversation.create({
      members: [req.user._id, otherUser._id],
    });

    const fullConversation = await conversation.populate('members', '-password');
    res.status(201).json(fullConversation);
  } catch (error) {
    console.error('createOrGetConversation error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOtherParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    const conversation = await Conversation.findById(conversationId).populate('members', 'username email profilePic',).populate({
  path: 'latestMessage',
  populate: {
    path: 'sender',
    select: 'username profilePic'
  }
});


    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const otherUser = conversation.members.find(member => member._id.toString() !== currentUserId);

    if (!otherUser) {
      return res.status(404).json({ message: 'Other participant not found' });
    }

    res.status(200).json(otherUser);
  } catch (error) {
    console.error('❌ Error fetching participant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getUserConversations = async (req, res) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({ members: userId })
    .populate('members', '-password')
    .sort({ updatedAt: -1 });

  const enriched = await Promise.all(conversations.map(async (conv) => {
    const latestMessage = await Message.findOne({ conversation: conv._id })
      .sort('-createdAt')
      .populate('sender', 'username');

    const unreadCount = await Message.countDocuments({
      conversation: conv._id,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });

    return {
      ...conv.toObject(),
      latestMessage: latestMessage || null,
      unreadCount
    };
  }));

  res.json(enriched);
};
exports.createGroupChat = async (req, res) => {
  const { name } = req.body;
  let members = [];

  try {
    if (req.body.members) {
      members = JSON.parse(req.body.members); // Should be an array of user IDs
    }

    console.log("🧪 Parsed members array:", members);

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    if (!Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ message: 'At least 2 group members required' });
    }

    // Ensure users exist
    const users = await User.find({ _id: { $in: members } });

    if (!users.length || users.length < 2) {
      return res.status(404).json({ message: 'Minimum 2 valid users required.' });
    }

    // Add current user if not already
    const allUserIds = [...users.map(u => u._id.toString()), req.user._id.toString()];
    const uniqueUserIds = [...new Set(allUserIds)];

    const groupPic = req.file ? `/uploads/groupPics/${req.file.filename}` : undefined;

    const groupChat = await Conversation.create({
      name: name.trim(),
      isGroupChat: true,
      members: uniqueUserIds,
      groupAdmin: req.user._id,
      groupPic,
    });

    const fullGroupChat = await Conversation.findById(groupChat._id)
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    console.error("❌ Error creating group chat:", error);
    res.status(500).json({ message: "Server error while creating group" });
  }
};

exports.addMemberToGroup = async (req, res) => {
  const { conversationId, userIdToAdd } = req.body;

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Unauthorized: User info missing' });
  }

  if (!conversationId || !userIdToAdd) {
    return res.status(400).json({ message: 'conversationId and userIdToAdd are required' });
  }

  try {
    const group = await Conversation.findById(conversationId);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.isGroupChat) return res.status(400).json({ message: "Not a group chat" });

    if (!group.groupAdmin) {
      return res.status(400).json({ message: 'Group admin is missing' });
    }

    // Only admin can add
    if (group.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only group admin can add members" });
    }

    // Prevent duplicates
    const isAlreadyMember = group.members.some(m => m.toString() === userIdToAdd);
    if (isAlreadyMember) {
      return res.status(400).json({ message: "User already a member" });
    }

    group.members.push(userIdToAdd);
    await group.save();

    const updatedGroup = await group.populate('members', '-password');

    // Emit socket events
    const io = req.app.get('io');
    if (!io) {
      console.warn('⚠️ Socket.io instance missing in req.app');
    } else {
      io.to(conversationId.toString()).emit('group-updated', updatedGroup);
      io.to(conversationId.toString()).emit('member-added', userIdToAdd);
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error('addMemberToGroup error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.removeGroupMember = async (req, res) => {
  const { conversationId, memberId } = req.body;

  if (!conversationId || !memberId) {
    return res.status(400).json({ message: 'conversationId and memberId are required' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({ message: 'Not a group chat' });
    }

if (!conversation.groupAdmin || conversation.groupAdmin.toString() !== req.user._id.toString()) {
  return res.status(403).json({ message: 'Only admin can remove members' });
}

    // Remove the member
    conversation.members = conversation.members.filter(
      m => m.toString() !== memberId
    );

    await conversation.save();

    res.status(200).json({
      message: 'Member removed successfully',
      conversation,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE group chat (admin only)
exports.deleteGroupChat = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({ message: 'Not a group chat' });
    }

    if (!conversation.groupAdmin || conversation.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can delete the group chat' });
    }

    await Conversation.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Group chat deleted successfully' });
  } catch (error) {
    res.status(400).json({
      status: 'Fail',
      message: error.message,
    });
  }
};
exports.markMessagesAsRead = async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.body;

  console.log(`🔥 markMessagesAsRead called by ${userId} for conversation ${conversationId}`);

  if (!conversationId) {
    console.log('❌ No conversationId');
    return res.status(400).json({ message: 'conversationId is required' });
  }

  try {
    const updated = await Message.updateMany(
      {
        conversation: conversationId,
        readBy: { $ne: userId }
      },
      { $push: { readBy: userId } }
    );

    console.log(`✅ Updated ${updated.modifiedCount || updated.nModified} messages as read`);

    const io = req.app.get('io');
    const conversation = await Conversation.findById(conversationId).populate('members', '_id');

    if (!conversation) {
      console.log('❌ Conversation not found');
      return res.status(404).json({ message: 'Conversation not found' });
    }

    for (const member of conversation.members) {
      const memberId = member._id.toString();

      const unreadCount = await Message.countDocuments({
        conversation: conversationId,
        sender: { $ne: memberId },
        readBy: { $ne: memberId }
      });

      console.log(`📤 Emitting unread-updated for ${memberId}: ${unreadCount}`);

      io.to(conversationId).emit('unread-updated', {
        conversationId,
        userId: memberId,
        unreadCount
      });
    }

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('❌ markMessagesAsRead error:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId)
      .populate('members', 'username email profilePic bio')
      .populate('groupAdmin', 'username email profilePic')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'username profilePic'
        }
      });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.isGroupChat) {
      const otherUser = conversation.members.find(
        (m) => m._id.toString() !== userId.toString()
      );
      return res.json(otherUser); // return just the other user
    }

    res.json(conversation);
  } catch (error) {
    console.error('❌ getConversationDetails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
