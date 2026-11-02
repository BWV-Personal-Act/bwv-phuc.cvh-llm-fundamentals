import OpenAI from "openai";

// maxRetries: 0 — retries are handled by utils/retry.mjs so they get logged.
export const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  maxRetries: 0,
});
