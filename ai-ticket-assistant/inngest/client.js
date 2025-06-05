import { Inngest } from "inngest";
import dotenv from "dotenv";
dotenv.config();

export const inngest = new Inngest({
  id: "ticketing-system",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
