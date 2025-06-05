import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import userRoutes from "./routes/user.js";
import Ticketroutes from "./routes/ticket.js";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { onUserSignup } from "./inngest/functions/on-signup.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";
import passport from "./config/passport.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

// Configure CORS to allow all necessary methods
app.use(cors());

app.use(express.json());

// Session middleware for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

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
