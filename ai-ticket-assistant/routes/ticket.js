import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createTicket,
  getTicket,
  getTickets,
  updateTicket,
  addTicketReply,
  updateTicketStatus,
} from "../controller/ticket.js";

const Ticketroutes = express.Router();

Ticketroutes.get("/", authenticate, getTickets);
Ticketroutes.get("/:id", authenticate, getTicket);
Ticketroutes.post("/", authenticate, createTicket);
Ticketroutes.post("/:id/reply", authenticate, addTicketReply);

// Put more specific routes first
Ticketroutes.patch("/:id/resolve", authenticate, updateTicketStatus);
Ticketroutes.patch("/:id/status", authenticate, updateTicketStatus);
Ticketroutes.patch("/:id/assign", authenticate, updateTicket);
Ticketroutes.patch("/:id", authenticate, updateTicket);

export default Ticketroutes;
