import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  message: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: "TODO" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  priority: String,
  deadline: Date,
  helpfulNotes: String,
  replyCanbeGiven: [String],
  relatedSkills: [String],
  replies: [replySchema],
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  assignedAt: Date,
});

export default mongoose.model("Ticket", ticketSchema);
