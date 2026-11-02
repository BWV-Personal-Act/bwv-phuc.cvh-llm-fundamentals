import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ConversationService } from "./services/conversation.service.mjs";
import { createLlmService } from "./services/llm.service.mjs";
import { client } from "./config/groq.client.mjs";
import { logger } from "./utils/logger.mjs";

const rl = readline.createInterface({
  input,
  output,
});

const conversation = new ConversationService({
  llm: createLlmService({ client, logger }),
});

console.log("Customer Support Assistant");
console.log("Commands: /history, /reset, /exit, /stats");

try {
  while (true) {
    const question = (await rl.question("\nYou: ")).trim();

    if (!question) {
      continue;
    }

    if (question === "/exit") {
      break;
    }

    if (question === "/reset") {
      conversation.reset();
      console.log("Conversation reset successfully.");
      continue;
    }

    if (question === "/history") {
      console.log(conversation.getHistory());
      continue;
    }

    if (question === "/stats") {
      const s = conversation.getStats();
      console.log(`
Requests:         ${s.requests}
Input Tokens:     ${s.promptTokens}
Output Tokens:    ${s.completionTokens}
Total Tokens:     ${s.totalTokens}
Estimated Cost:   ${s.estimatedCost.toFixed(5)}`);
      continue;
    }

    try {
      const { answer } = await conversation.chat(question);
      console.log(`\nAI: ${answer}`);
    } catch (error) {
      console.error("Chat failed:", error.message);
    }
  }
} finally {
  rl.close();
}