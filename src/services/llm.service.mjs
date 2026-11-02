import { withRetry } from "../utils/retry.mjs";

// No HTTP status = network error or timeout, also worth retrying.
const isRetryable = (e) => e.status === undefined || e.status === 429 || e.status >= 500;

function toUserMessage(e) {
  if (e.status === 401) return "Invalid or missing GROQ_API_KEY (HTTP 401).";
  if (e.status === 404) return "Model or endpoint not found (HTTP 404).";
  if (e.status === 429) return "Rate limit exceeded (HTTP 429). Please try again later.";
  if (e.status >= 500) return `Groq service unavailable (HTTP ${e.status}). Please try again later.`;
  if (e.name === "APIConnectionTimeoutError") return "Request timed out.";
  return `Request failed: ${e.message}`;
}

export function createLlmService({
  client,
  logger,
  model = "openai/gpt-oss-120b",
  timeoutMs = 15_000,
  retry = {},
}) {
  return {
    async complete(messages) {
      try {
        return await withRetry(async (attempt) => {
          const start = Date.now();
          logger.info("llm.request", { attempt, model, messages: messages.length });
          const response = await client.chat.completions.create(
            { model, messages, reasoning_effort: "low", max_completion_tokens: 500 },
            { timeout: timeoutMs },
          );
          logger.info("llm.response", { attempt, ms: Date.now() - start, usage: response.usage });
          return response;
        }, {
          ...retry,
          isRetryable,
          onRetry: ({ attempt, delayMs, error }) =>
            logger.warn("llm.retry", { attempt, delayMs, status: error.status, error: error.message }),
        });
      } catch (error) {
        logger.error("llm.failed", { status: error.status, error: error.message });
        throw new Error(toUserMessage(error), { cause: error });
      }
    },
  };
}
