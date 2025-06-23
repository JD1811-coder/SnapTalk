const Conversation = require("../model/conversation");
const Message = require("../model/message");
const User = require("../model/user");

// ✅ Create or fetch one-to-one conversation
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createOrGetConversation = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: "Username or email is required" });
  }

  try {
    const otherUser = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (otherUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't chat with yourself" });
    }

    let conversation = await Conversation.findOne({
      isGroupChat: false,
      members: { $all: [req.user._id, otherUser._id] },
    }).populate("members", "-password");

    if (conversation) {
      return res.status(200).json(conversation);
    }

    conversation = await Conversation.create({
      members: [req.user._id, otherUser._id],
    });

    const fullConversation = await conversation.populate("members", "-password");
    res.status(201).json(fullConversation);
  } catch (error) {
    console.error("createOrGetConversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOtherParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    const conversation = await Conversation.findById(conversationId)
      .populate("members", "username email profilePic")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username profilePic" },
      });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const otherUser = conversation.members.find(
      (member) => member._id.toString() !== currentUserId
    );

    if (!otherUser) {
      return res.status(404).json({ message: "Other participant not found" });
    }

    res.status(200).json(otherUser);
  } catch (error) {
    console.error("❌ Error fetching participant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserConversations = async (req, res) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({ members: userId })
    .populate("members", "-password")
    .sort({ updatedAt: -1 });

  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const latestMessage = await Message.findOne({ conversation: conv._id })
        .sort("-createdAt")
        .populate("sender", "username");

      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      });

      return {
        ...conv.toObject(),
        latestMessage: latestMessage || null,
        unreadCount,
      };
    })
  );

  res.json(enriched);
};

exports.createGroupChat = async (req, res) => {
  const { name } = req.body;
  let members = [];

  try {
    if (req.body.members) {
      members = JSON.parse(req.body.members);
    }

    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ message: "At least 2 group members required" });
    }

    const users = await User.find({ _id: { $in: members } });

    if (!users.length || users.length < 2) {
      return res.status(404).json({ message: "Minimum 2 valid users required." });
    }

    const allUserIds = [...users.map((u) => u._id.toString()), req.user._id.toString()];
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

  if (!conversationId || !userIdToAdd) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const group = await Conversation.findById(conversationId);

    if (!group || !group.isGroupChat)
      return res.status(404).json({ message: "Group not found" });

    if (group.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    if (group.members.includes(userIdToAdd)) {
      return res.status(400).json({ message: "User already in group" });
    }

    group.members.push(userIdToAdd);
    await group.save();

    const addedUser = await User.findById(userIdToAdd);
    const msg = `${req.user.username} added ${addedUser.username} to the group`;

    await Message.create({
      sender: req.user._id,
      text: msg,
      isSystem: true,
      conversation: conversationId,
    });

    const updatedGroup = await Conversation.findById(conversationId)
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(updatedGroup);
  } catch (err) {
    console.error("❌ addMemberToGroup error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.removeGroupMember = async (req, res) => {
  const { conversationId, userId } = req.body;

  if (!conversationId || !userId) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const group = await Conversation.findById(conversationId);

    if (!group || !group.isGroupChat)
      return res.status(404).json({ message: "Group not found" });

    if (group.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId
    );
    await group.save();

    const removedUser = await User.findById(userId);
    const msg = `${req.user.username} removed ${removedUser.username} from the group`;

    await Message.create({
      sender: req.user._id,
      text: msg,
      isSystem: true,
      conversation: conversationId,
    });

    const updatedGroup = await Conversation.findById(conversationId)
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(updatedGroup);
  } catch (err) {
    console.error("❌ removeMemberFromGroup error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGroupChat = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({ message: "Not a group chat" });
    }

    if (
      !conversation.groupAdmin ||
      conversation.groupAdmin.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Only admin can delete the group chat" });
    }

    await Conversation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Group chat deleted successfully" });
  } catch (error) {
    res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.body;

  if (!conversationId) {
    return res.status(400).json({ message: "conversationId is required" });
  }

  try {
    const updated = await Message.updateMany(
      {
        conversation: conversationId,
        readBy: { $ne: userId },
      },
      { $push: { readBy: userId } }
    );

    const io = req.app.get("io");
    const conversation = await Conversation.findById(conversationId).populate(
      "members",
      "_id"
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    for (const member of conversation.members) {
      const memberId = member._id.toString();

      const unreadCount = await Message.countDocuments({
        conversation: conversationId,
        sender: { $ne: memberId },
        readBy: { $ne: memberId },
      });

      io.to(conversationId).emit("unread-updated", {
        conversationId,
        userId: memberId,
        unreadCount,
      });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("❌ markMessagesAsRead error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId)
      .populate("members", "username email profilePic bio")
      .populate("groupAdmin", "username email profilePic")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "username profilePic",
        },
      });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conversation);
  } catch (error) {
    console.error("❌ getConversationDetails error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateGroupChat = async (req, res) => {
  const { conversationId, name } = req.body;

  if (!conversationId)
    return res.status(400).json({ message: "conversationId required" });

  try {
    const group = await Conversation.findById(conversationId);
    if (!group || !group.isGroupChat)
      return res.status(404).json({ message: "Group not found" });

    if (group.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only group admin can update" });
    }

    let systemMsg = null;

    if (name && name !== group.name) {
      systemMsg = `${req.user.username} changed group name to \"${name}\"`;
      group.name = name;
    }

    if (req.file) {
      systemMsg = `${req.user.username} changed the group display picture`;
      group.groupPic = `/uploads/groupPics/${req.file.filename}`;
    }

    await group.save();

    if (systemMsg) {
      await Message.create({
        sender: req.user._id,
        text: systemMsg,
        isSystem: true,
        conversation: conversationId,
      });
    }

    const updatedGroup = await Conversation.findById(group._id)
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(updatedGroup);
  } catch (err) {
    console.error("❌ updateGroupChat error:", err);
    res.status(500).json({ message: err.message });
  }
};
