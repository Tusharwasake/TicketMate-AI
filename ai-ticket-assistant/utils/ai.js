import { createAgent, gemini } from "@inngest/agent-kit";
import dotenv from "dotenv";
dotenv.config();

const AnalyzeTicket = async (ticket) => {
  try {
    const supportAgent = createAgent({
      model: gemini({
        model: "gemini-1.5-flash-8b",
        apiKey: process.env.GEMINI_API_KEY,
      }),
      name: "AI Ticket Triage Assistant",
      system: `You are an expert AI assistant that processes technical support tickets. 

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.
5. Generate 3 suggested replies (max 50 words each) that the assigned person can use.

IMPORTANT:
- Respond with ONLY valid raw JSON.
- Do NOT include markdown, code fences, comments, or any extra formatting.
- The format must be a raw JSON object starting with { and ending with }.
- Each reply suggestion should be professional, helpful, and under 50 words.

Example format:
{"summary":"Brief description","priority":"medium","helpfulNotes":"Detailed explanation","relatedSkills":["skill1","skill2"],"replySuggestions":["suggestion1","suggestion2","suggestion3"]}`,
    });

    const response =
      await supportAgent.run(`Analyze this support ticket and return ONLY a JSON object:

Required JSON format:
{
  "summary": "1-2 sentence summary of the issue",
  "priority": "low|medium|high",
  "helpfulNotes": "Detailed technical explanation with resources",
  "relatedSkills": ["skill1", "skill2", "skill3"],
  "replySuggestions": [
    "First reply suggestion (max 50 words)",
    "Second reply suggestion (max 50 words)", 
    "Third reply suggestion (max 50 words)"
  ]
}

Ticket Details:
Title: ${ticket.title}
Description: ${ticket.description}

Generate professional, helpful reply suggestions that address the user's issue. Each suggestion should be under 50 words and provide actionable guidance.

Return ONLY the JSON object, no other text:`);

    // Extract content from the correct response structure
    const rawResponse = response.output[0].content.trim();
    console.log("AI raw response:", rawResponse);

    // Parse the JSON response
    try {
      const parsed = JSON.parse(rawResponse);
      console.log("✅ AI analysis successful");
      return parsed;
    } catch (parseError) {
      console.warn("⚠️ JSON parse failed, trying fallback methods...");

      // Fallback: try to extract JSON from markdown if it exists
      const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Last resort: try to find JSON-like content
      const jsonStart = rawResponse.indexOf("{");
      const jsonEnd = rawResponse.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = rawResponse.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
      }

      throw new Error("Could not extract valid JSON from AI response");
    }
  } catch (error) {
    console.error("❌ Failed to analyze ticket with AI:", error.message);

    // Return a fallback response structure with default reply suggestions
    return {
      summary: `Unable to analyze: ${ticket.title}`,
      priority: "medium",
      helpfulNotes: `AI analysis failed. Manual review required for ticket: "${ticket.title}". Original description: ${ticket.description}`,
      relatedSkills: ["general-support"],
      replySuggestions: [
        "Thank you for contacting support. I've received your ticket and will investigate this issue promptly. I'll get back to you within 24 hours with an update.",
        "I understand your concern regarding this issue. Let me look into this matter and provide you with a detailed solution as soon as possible.",
        "Your ticket has been assigned to me. I'm currently reviewing the details and will respond with next steps shortly. Thank you for your patience.",
      ],
    };
  }
};

export default AnalyzeTicket;
