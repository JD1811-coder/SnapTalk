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
 * Get all groups
 */
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find();
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

/**
 * Delete a group by ID
 */
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
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
    const conversations = await Conversation.find().populate(
      "participants",
      "username profilePic"
    );
    res.json({
      success: true,
      data: conversations,
      message: "Fetched all conversations successfully",
    });
  } catch (err) {
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
