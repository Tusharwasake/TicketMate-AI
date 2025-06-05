import express from "express";
import {
  getUsers,
  login,
  logout,
  signup,
  updateUser,
} from "../controller/user.js";
import { authenticate } from "../middlewares/auth.js";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";

const userRoutes = express.Router();

userRoutes.post("/signup", signup);
userRoutes.post("/login", login);

// Google OAuth routes
userRoutes.get("/google", 
  passport.authenticate("google", { scope: ["profile", "email"] })
);

userRoutes.get("/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      {
        _id: req.user._id,
        role: req.user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" }
    );    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      avatar: req.user.avatar
    }))}`);
  }
);

// Facebook OAuth routes
userRoutes.get("/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

userRoutes.get("/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      {
        _id: req.user._id,
        role: req.user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      avatar: req.user.avatar
    }))}`);
  }
);

userRoutes.post("/update-user", authenticate, updateUser);
userRoutes.get("/users", authenticate, getUsers);
userRoutes.post("/logout", logout);

export default userRoutes;
