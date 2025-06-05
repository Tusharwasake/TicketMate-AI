import Ticket from "../models/ticket.js";
import { eventSender } from "../inngest/eventSender.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and Description are required" });
    }

    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

    // Trigger background processing with Inngest
    const inngestResponse = await eventSender.send({
      name: "ticket/created",
      data: {
        ticketId: newTicket._id.toString(),
        title,
        description,
        createdBy: req.user._id.toString(),
      },
    });

    console.log("Inngest event sent:", { inngestResponse });

    return res.status(201).json({
      message: "Ticket Created and Processing",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error Creating ticket", error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};

export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];

    if (user.role !== "user") {
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets", error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    if (user.role !== "user") {
      ticket = await Ticket.findById(req.params.id)
        .populate("assignedTo", ["email", "role", "_id"])
        .populate("replies.author", ["email", "role", "_id"]);
    } else {
      ticket = await Ticket.findOne({
        createdBy: user._id,
        _id: req.params.id,
      })
        .select("title description status createdAt replies")
        .populate("replies.author", ["email", "role", "_id"]);
    }

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // FIXED: Changed status code from 404 to 200 for successful response
    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket", error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};

// Add reply to a ticket
export const addTicketReply = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { message, status } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user has permission to reply
    // Users can only reply to their own tickets
    // Admins, moderators, and assigned agents can reply to any ticket
    if (
      user.role === "user" &&
      ticket.createdBy.toString() !== user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user has permission to update status (if status is provided)
    if (status) {
      if (
        user.role === "user" &&
        (!ticket.assignedTo ||
          ticket.assignedTo.toString() !== user._id.toString())
      ) {
        return res.status(403).json({
          message: "Access denied - insufficient permissions to update status",
        });
      }
    }

    // Add the reply
    const newReply = {
      message,
      author: user._id,
      createdAt: new Date(),
    };

    ticket.replies.push(newReply);
    ticket.updatedAt = new Date();

    // Update status if provided and user has permission
    if (status) {
      ticket.status = status;

      // If status is resolved, set resolvedAt
      if (status.toLowerCase() === "resolved") {
        ticket.resolvedAt = new Date();
      }
    }

    await ticket.save();

    // Populate the author info for the reply
    const updatedTicket = await Ticket.findById(id)
      .populate("assignedTo", ["email", "role", "_id"])
      .populate("replies.author", ["email", "role", "_id"]);

    // Trigger notification (you can implement this with Inngest)
    if (user._id.toString() !== ticket.createdBy.toString()) {
      // Send notification to ticket creator
      await eventSender.send({
        name: "ticket/reply-added",
        data: {
          ticketId: ticket._id.toString(),
          reply: message,
          author: user.email,
          createdBy: ticket.createdBy.toString(),
        },
      });
    }
    return res.status(200).json({
      message: status
        ? "Reply added and status updated successfully"
        : "Reply added successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Error adding reply", error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};

// Update ticket status
export const updateTicketStatus = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user has permission to update status
    // Only admins, moderators, or the assigned agent can update status
    if (
      user.role === "user" &&
      (!ticket.assignedTo ||
        ticket.assignedTo.toString() !== user._id.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update status
    ticket.status = status;
    ticket.updatedAt = new Date();

    // If status is resolved, set resolvedAt
    if (status.toLowerCase() === "resolved") {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(id).populate("assignedTo", [
      "email",
      "role",
      "_id",
    ]);

    // Notify ticket creator about status change
    if (user._id.toString() !== ticket.createdBy.toString()) {
      await eventSender.send({
        name: "ticket/status-updated",
        data: {
          ticketId: ticket._id.toString(),
          newStatus: status,
          updatedBy: user.email,
          createdBy: ticket.createdBy.toString(),
        },
      });
    }

    return res.status(200).json({
      message: "Ticket status updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Error updating ticket status", error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};

// Update ticket (general updates)
export const updateTicket = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const updates = req.body;

    // Only admins, moderators or assigned agents can update tickets
    if (
      user.role === "user" &&
      (!updates.assignedTo ||
        updates.assignedTo.toString() !== user._id.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // If assigning the ticket, set assignedAt
    if (
      updates.assignedTo &&
      (!ticket.assignedTo ||
        ticket.assignedTo.toString() !== updates.assignedTo)
    ) {
      updates.assignedAt = new Date();
    }

    // Always update the updatedAt field
    updates.updatedAt = new Date();

    const updatedTicket = await Ticket.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("assignedTo", ["email", "role", "_id"]);

    // Notify ticket creator about important updates
    if (user._id.toString() !== ticket.createdBy.toString()) {
      await eventSender.send({
        name: "ticket/updated",
        data: {
          ticketId: ticket._id.toString(),
          updates,
          updatedBy: user.email,
          createdBy: ticket.createdBy.toString(),
        },
      });
    }

    return res.status(200).json({
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Error updating ticket", error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Only admins can delete tickets
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await Ticket.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ticket", error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};
