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

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin || "*");
    },
    credentials: true,
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
    app.listen(PORT, async () => {
      console.log(`✅Server Started at: http://localhost:${PORT}`);
      console.log(`➡️ Inngest running at http://localhost:${PORT}/api/inngest`);

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
