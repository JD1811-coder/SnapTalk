const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    file: { type: String },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        emoji: String,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    unreadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },

  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
