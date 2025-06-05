import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import AnalyzeTicket from "../../utils/ai.js";
import User from "../../models/user.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      // Step 1: Fetch ticket from database
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);

        if (!ticketObject) {
          throw new NonRetriableError(
            JSON.stringify({
              message: "Ticket not found",
              code: "TICKET_NOT_FOUND",
            })
          );
        }

        return ticketObject;
      });

      // Step 2: Update initial ticket status
      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
        console.log("Updated ticket status to TODO");
      });

      // Step 3: Call AI analysis (without step wrapper)
      console.log("Starting AI analysis...");
      const aiResponse = await AnalyzeTicket(ticket);
      console.log("AI Analysis Result:", aiResponse);

      // Step 4: Validate AI response structure (now includes reply suggestions)
      const isValidAIResponse = (response) => {
        return (
          response &&
          typeof response === "object" &&
          typeof response.summary === "string" &&
          ["low", "medium", "high"].includes(response.priority) &&
          typeof response.helpfulNotes === "string" &&
          Array.isArray(response.relatedSkills) &&
          Array.isArray(response.replySuggestions) &&
          response.replySuggestions.length > 0
        );
      };

      // Step 5: Process AI response and update ticket with reply suggestions
      const relatedSkills = await step.run("process-ai-response", async () => {
        let skills = [];

        if (isValidAIResponse(aiResponse)) {
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: aiResponse.priority,
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills,
            replyCanbeGiven: aiResponse.replySuggestions, // Store reply suggestions
          });
          skills = aiResponse.relatedSkills;
          console.log(
            "✅ Updated ticket with AI analysis and reply suggestions"
          );
        } else {
          console.warn("Invalid AI response, using default values");
          const defaultReplySuggestions = [
            "Thank you for contacting support. I've received your ticket and will investigate this issue promptly.",
            "I understand your concern. Let me look into this matter and provide you with a solution as soon as possible.",
            "Your ticket has been assigned to me. I'm currently reviewing the details and will respond with next steps shortly.",
          ];

          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: "medium",
            helpfulNotes: "AI analysis failed - requires manual review",
            status: "IN_PROGRESS",
            relatedSkills: [],
            replyCanbeGiven: defaultReplySuggestions,
          });
        }

        return skills;
      });

      // Step 6: Find and assign moderator
      const moderator = await step.run("assign-moderator", async () => {
        let user = null;

        // Only search by skills if we have valid skills
        if (relatedSkills && relatedSkills.length > 0) {
          // Escape regex special characters in skills
          const escapedSkills = relatedSkills.map((skill) =>
            skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          );

          user = await User.findOne({
            role: "moderator",
            skills: {
              $elemMatch: {
                $regex: escapedSkills.join("|"),
                $options: "i",
              },
            },
          });
        }

        // Fallback to any moderator, then admin
        if (!user) {
          user = await User.findOne({ role: "moderator" });
        }

        if (!user) {
          user = await User.findOne({ role: "admin" });
        }

        await Ticket.findByIdAndUpdate(ticket._id, {
          assignedTo: user?._id || null,
        });

        return user;
      });

      // Step 7: Send email notification with reply suggestions
      await step.run("send-email-notification", async () => {
        if (moderator) {
          // Get the updated ticket with reply suggestions
          const updatedTicket = await Ticket.findById(ticket._id);

          // Create email content with reply suggestions
          const replySuggestionsText = updatedTicket.replyCanbeGiven
            ? `\n\nSuggested Replies:\n${updatedTicket.replyCanbeGiven
                .map((reply, index) => `${index + 1}. ${reply}`)
                .join("\n")}`
            : "";

          await sendMail(
            moderator.email,
            "Ticket Assigned - Reply Suggestions Included",
            `A new ticket has been assigned to you: ${ticket.title}
            
Priority: ${updatedTicket.priority}
Helpful Notes: ${updatedTicket.helpfulNotes}${replySuggestionsText}

You can use these suggested replies as starting points for your response.`
          );
        }
      });

      return {
        success: true,
        ticketId: ticket._id,
        assignedTo: moderator?._id,
      };
    } catch (error) {
      console.error("Error in ticket processing workflow:", error.message);
      return { success: false, error: error.message };
    }
  }
);
