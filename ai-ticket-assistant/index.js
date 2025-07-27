import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/user.js";
import Ticketroutes from "./routes/ticket.js";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { onUserSignup } from "./inngest/functions/on-signup.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";
import fetch from "node-fetch";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://aiagentticket.netlify.app",
      "https://ticketmate-ai.netlify.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);

app.use(express.json());

// Add security headers for CORS

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.get("/health", async (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
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
    console.log("MongoDB connected ");
    app.listen(PORT, async () => {
      console.log(`Server Started at: http://localhost:${PORT}`);
      console.log(`Inngest running at http://localhost:${PORT}/api/inngest`);

      if (process.env.RENDER_EXTERNAL_URL) {
        console.log(
          `Attempting self-register. Functions: `,
          [onUserSignup, onTicketCreated].map((f) => f.name).join(", ")
        );

        const inngestURL = new URL(
          "/api/inngest",
          process.env.RENDER_EXTERNAL_URL
        );
        const result = await fetch(inngestURL, {
          method: "PUT",
        });
        function sleep(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        try {
          const json = await result.json();
          console.log(
            `Register attempted:`,
            inngestURL.toString(),
            result.status,
            json
          );
        } catch (err) {
          console.log(
            `Register failed:`,
            inngestURL.toString(),
            result.status,
            result.body
          );
        }
      }
    });
  })
  .catch((err) => console.error("MONGODB Error"));
