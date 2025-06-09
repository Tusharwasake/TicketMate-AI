import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";
import { eventSender } from "../inngest/eventSender.js";
dotenv.config();

export const signup = async (req, res) => {
  const { email, password, role = "user", skills = [] } = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }    // Role validation
    const allowedRoles = ["user", "moderator"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Allowed roles are: user, moderator",
      });
    }

    // Skills validation
    if (skills && !Array.isArray(skills)) {
      return res.status(400).json({
        error: "Skills must be an array",
      });
    }

    // Validate each skill
    if (skills && skills.length > 0) {
      const invalidSkills = skills.filter(skill => 
        typeof skill !== 'string' || skill.trim().length === 0
      );
      if (invalidSkills.length > 0) {
        return res.status(400).json({
          error: "All skills must be non-empty strings",
        });
      }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    // FIXED: Check if user already exists to prevent duplicates
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);    // Create user with lowercase email for consistency
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashPassword,
      role: role || "user", // Set the role, default to "user"
      skills: skills ? skills.map(skill => skill.trim()).filter(skill => skill.length > 0) : [],
    });

    // Fire inngest event
    const inngestresponse = await eventSender.send({
      name: "user/signup",
      data: {
        email: user.email,
      },
    });

    console.log(inngestresponse);

    // Generate JWT token
    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" } // Added token expiration
    );

    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json({
      user: userResponse,
      token,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    res.status(500).json({
      error: "Signup failed",
      details: error.message,
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user with case-insensitive email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" } // Added token expiration
    );

    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.json({
      user: userResponse,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Login failed",
      details: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    // Verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: "Invalid token",
        });
      }
    });

    // Note: In a production app, you might want to add the token to a blacklist
    // For now, just send success response
    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout failed",
      details: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  const { skills = [], role, email } = req.body;

  try {
    // Check admin permission
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        error: "Access denied. Admin role required.",
      });
    }

    // Input validation
    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Update user
    const updateData = {};
    if (skills.length > 0) updateData.skills = skills;
    if (role) updateData.role = role;

    await User.updateOne({ email: email.toLowerCase() }, updateData);

    res.json({
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      error: "Update failed",
      details: error.message,
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    // Check admin permission
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        error: "Access denied. Admin role required.",
      });
    }

    // Get all users without passwords
    const users = await User.find().select("-password");

    res.json({
      users,
      count: users.length,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: "Failed to retrieve users",
      details: error.message,
    });
  }
};
