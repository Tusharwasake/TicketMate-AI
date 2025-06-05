import mongoose from "mongoose";
import User from "./models/user.js";
import dotenv from "dotenv";

dotenv.config();

async function checkUsers() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Find all users
    const users = await User.find({});
    console.log("All users in database:");
    users.forEach((user) => {
      console.log(
        `- Email: ${user.email}, Role: ${user.role}, ID: ${user._id}`
      );
    });

    if (users.length === 0) {
      console.log("No users found in database!");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
