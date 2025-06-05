// inngest/eventSender.js
import { Inngest } from "inngest";
import dotenv from "dotenv";
dotenv.config();

export const eventSender = new Inngest({
  id: "TicketMate AI Sender",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
