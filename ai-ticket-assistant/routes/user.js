import express from "express";
import {
  getUsers,
  login,
  logout,
  signup,
  updateUser,
  updateProfile,
} from "../controller/user.js";
import { authenticate } from "../middlewares/auth.js";

const userRoutes = express.Router();

userRoutes.post("/signup", signup);
userRoutes.post("/login", login);

userRoutes.post("/update-user", authenticate, updateUser);
userRoutes.patch("/profile", authenticate, updateProfile);
userRoutes.get("/users", authenticate, getUsers);
userRoutes.post("/logout", logout);

export default userRoutes;
