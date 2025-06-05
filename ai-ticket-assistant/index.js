import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/user.js";
import Ticketroutes from "./routes/ticket.js";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { onUserSignup } from "./inngest/functions/on-signup.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

// Configure CORS to allow multiple origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "https://3aiagentticket.netlify.app",
  "https://aiagentticket.netlify.app/", // The actual domain from the error
  "https://ticketmate-ai.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`CORS blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Origin:", req.get("Origin"));
  console.log("User-Agent:", req.get("User-Agent"));
  next();
});

// Add explicit OPTIONS handler for debugging
app.options("*", (req, res) => {
  console.log("OPTIONS request received for:", req.url);
  console.log("Origin:", req.get("Origin"));
  res.sendStatus(200);
});

app.get("/health", async (req, res) => {
  res.send("healthy");
});

app.use("/api/auth", userRoutes);
app.use("/api/tickets", Ticketroutes);

// Create Inngest handler
const inngestHandler = serve({
  client: inngest,
  functions: [onUserSignup, onTicketCreated],
});

app.use("/api/inngest", inngestHandler);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MonGoDB connected ");
    app.listen(PORT, () => {
      console.log(`Server Started at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("MONGODB Error"));
