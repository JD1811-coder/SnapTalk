const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      trim: true
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Conversation',
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    
  },

  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
