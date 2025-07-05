const User = require("../model/user");
const Message = require("../model/message");
const Conversation = require("../model/conversation");

/**
 * Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({
      success: true,
      data: users,
      message: "Fetched all users successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: err.message,
    });
  }
};

/**
 * Delete a user by ID
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: err.message,
    });
  }
};

/**
 * Toggle block/unblock a user
 */
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while toggling block status",
      error: err.message,
    });
  }
};

/**
 * Get all groups (from conversations where isGroup: true)
 */
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Conversation.find({ isGroupChat: true }).populate("members", "username profilePic");
    res.json({
      success: true,
      data: groups,
      message: "Fetched all groups successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching groups",
      error: err.message,
    });
  }
};
exports.getMessagesByConversationId = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username")
      .sort({ createdAt: -1 }); // latest first

    res.json({
      success: true,
      data: messages,
      message: "Fetched messages for conversation",
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
      error: err.message,
    });
  }
};
exports.deleteMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);
    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting message",
      error: err.message,
    });
  }
};

/**
 * Delete a group by ID (delete conversation with isGroup: true)
 */
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Conversation.findOneAndDelete({ _id: req.params.id, isGroup: true });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    res.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting group",
      error: err.message,
    });
  }
};

/**
 * Get all conversations
 */
exports.getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate("members", "username profilePic")
      .populate("groupAdmin", "username profilePic")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "username profilePic",
        },
      });

    res.json({
      success: true,
      data: conversations,
      message: "Fetched all conversations successfully",
    });
  } catch (err) {
    console.error("🔥 Error in getAllConversations:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversations",
      error: err.message,
    });
  }
};


/**
 * Delete a message by ID
 */
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message)
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting message",
      error: err.message,
    });
  }
};
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    res.json({ success: true, data: admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.toggleDisableUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDisabled = !user.isDisabled;
    await user.save();

    // ✅ Emit real-time disable event if user is disabled
    if (user.isDisabled) {
      const io = req.app.get("io"); // get io instance from app
      io.to(userId).emit("user-disabled", {
        message: "Your account has been disabled by admin.",
      });
    }

    res.json({
      success: true,
      message: `User ${user.isDisabled ? "disabled" : "enabled"}.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
