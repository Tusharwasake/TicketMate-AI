import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Make password optional for OAuth users
  name: { type: String },
  avatar: { type: String },
  googleId: { type: String },
  facebookId: { type: String },
  role: { type: String, default: "user", enum: ["user", "moderator", "admin"] },
  skills: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
