const Message = require('../model/message');
const Conversation = require('../model/conversation');

  exports.sendMessage = async (req, res) => {
    const { text, conversationId } = req.body;
    const file = req.file;

    if (!text && !file) {
      return res.status(400).json({ message: "Text or file is required" });
    }

    try {
      const newMessage = await Message.create({
        sender: req.user._id,
        text,
        file: file ? `/uploads/${file.filename}` : null,
        conversation: conversationId,
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        latestMessage: newMessage._id,
      });

      const fullMessage = await newMessage.populate("sender", "-password");

      const finalMessage = {
        ...fullMessage.toObject(),
        conversationId: fullMessage.conversation.toString(),
      };

      const io = req.app.get("io");
      io.to(conversationId).emit("message-received", finalMessage);

      res.status(201).json(finalMessage);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  try {
    const msgs = await Message.find({ conversation: conversationId })
      .sort('createdAt')
      .populate('sender', 'username profilePic');

    // Mark unread messages as read by current user
    const unreadMessages = msgs.filter(m => !m.readBy.includes(userId));
    await Message.updateMany(
      { _id: { $in: unreadMessages.map(m => m._id) } },
      { $push: { readBy: userId } }
    );

    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

exports.updateMessage = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      {
        text,
        isEdited: true
      },
      { new: true }
    ).populate('sender', '-password');

    if (!updatedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const io = req.app.get('io');
    io.to(updatedMessage.conversation.toString()).emit('message-edited', updatedMessage);

    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedMessage = await Message.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const io = req.app.get('io');
    io.to(deletedMessage.conversation.toString()).emit('message-deleted', {
      _id: deletedMessage._id,
      conversation: deletedMessage.conversation
    });

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.markMessagesAsRead = async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.body;

  if (!conversationId) {
    return res.status(400).json({ message: 'conversationId is required' });
  }

  try {
    // Find all unread messages in the conversation for this user
    const messages = await Message.updateMany(
      { 
        conversation: conversationId,
        readBy: { $ne: userId }
      },
      { $push: { readBy: userId } }
    );

    // Emit socket event for read receipt
    const io = req.app.get('io');
    io.to(conversationId).emit('message-read', { userId, conversationId });

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};exports.reactToMessage = async (req, res) => {
  const { messageId, emoji } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId).populate('reactions.user');
    const existing = message.reactions.find(
      (r) => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existing) {
      message.reactions = message.reactions.filter(
        (r) => !(r.user.toString() === userId.toString() && r.emoji === emoji)
      );
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    const updated = await Message.findById(messageId).populate('reactions.user');
    io.emit('reaction-updated', updated); // 🔥 Emit to everyone
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Reaction failed', error: err.message });
  }
};
